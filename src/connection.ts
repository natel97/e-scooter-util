const FAST_BYTES = [
  0x55, 0xab, 0x4d, 0x41, 0x58, 0x32, 0x53, 0x63, 0x6f, 0x6f, 0x74, 0x65, 0x72,
  0x5f, 0x31,
];
const NORMAL_BYTES = [
  0x55, 0xab, 0x4d, 0x41, 0x58, 0x32, 0x53, 0x63, 0x6f, 0x6f, 0x74, 0x65, 0x72,
  0x5f, 0x30,
];
const SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const CHARACTERISTIC = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

function withTimeout<T>(timeout = 5000, func: Promise<T>): Promise<T> {
  return Promise.race([
    func,
    new Promise((_, rej) => setTimeout(() => rej("Timeout occurred"), timeout)),
  ]) as Promise<T>;
}
export type SCOOTER_SPEED = "fast" | "normal";

export type ScooterState = {
  scooter: "CONNECTED" | "DISCONNECTED";
  server: "CONNECTED" | "DISCONNECTED";
  service: "CONNECTED" | "DISCONNECTED";
  characteristicData: "CONNECTED" | "DISCONNECTED";
};

export class ScooterConnection {
  private _device: BluetoothDevice | null = null;
  private _server: BluetoothRemoteGATTServer | null = null;
  private _service: BluetoothRemoteGATTService | null = null;
  private _characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private _currentValueState: DataView | null = null;
  private onChange: (((state: ScooterState) => void) | null)[] = [];

  // Boring setter logic

  private set device(val: BluetoothDevice | null) {
    this._device = val;
    this.notifyChange();
  }

  private get device() {
    return this._device;
  }

  private set server(val: BluetoothRemoteGATTServer | null) {
    this._server = val;
    this.notifyChange();
  }

  private get server() {
    return this._server;
  }

  private set service(val: BluetoothRemoteGATTService | null) {
    this._service = val;
    this.notifyChange();
  }

  private get service() {
    return this._service;
  }

  private set characteristic(val: BluetoothRemoteGATTCharacteristic | null) {
    this._characteristic = val;
    this.notifyChange();
  }

  private get characteristic() {
    return this._characteristic;
  }

  private set currentValueState(val: DataView | null) {
    this._currentValueState = val;
    this.notifyChange();
  }

  private get setCurrentValueState() {
    return this._currentValueState;
  }

  // Connection Details

  public async Connect(): Promise<Error | null> {
    try {
      console.log("Searching for device...");
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE] }],
      });
      if (!this.device.gatt) {
        return new Error("GATT service unreachable");
      }

      console.log("Connecting...");
      this.server = await withTimeout(6000, this.device.gatt.connect());
      if (!this.server) {
        return new Error("Failed to connect to server");
      }

      this.device.addEventListener("gattserverdisconnected", () => {
        this.characteristic = null;
        this.service = null;
        this.server = null;
      });

      console.log("Fetching needed service...");
      this.service = await withTimeout(
        5000,
        this.server.getPrimaryService(SERVICE)
      );
      if (!this.service) {
        return new Error("Service is null");
      }

      this.service.getCharacteristics().then(console.log);

      console.log("Fetching Characteristic...");
      this.characteristic = await withTimeout(
        4000,
        this.service.getCharacteristic(CHARACTERISTIC)
      );
      if (!this.characteristic) {
        return new Error("Characteristic is null");
      }

      //   this.characteristic.addEventListener(
      //     "characteristicvaluechanged",
      //     console.log
      //   );

      console.log("Fetching current data...");
      //   this.currentValueState = await this.characteristic.readValue();
      this.characteristic.startNotifications().then(console.log);
    } catch (error: unknown) {
      console.log(error);
      return error as Error;
    }

    return null;
  }

  async UpdateScooterState(speed: SCOOTER_SPEED): Promise<Error | null> {
    if (!this.device) {
      return new Error("Device is null, please connect first");
    }
    if (!this.device.gatt?.connected) {
      const server = await this.device.gatt?.connect();
      if (!server) {
        return new Error("failed to connect to server");
      }
      this.server = server;
    }

    const service = await this.server?.getPrimaryService(SERVICE);
    if (!service) {
      return new Error("Service is null");
    }

    this.service = service;
    const characteristic = await this.service.getCharacteristic(CHARACTERISTIC);
    if (!characteristic) {
      return new Error("Characteristic failed to fetch");
    }
    this.characteristic = characteristic;

    const bytes = speed === "fast" ? FAST_BYTES : NORMAL_BYTES;
    console.log("Writing bytes: ", speed);
    await this.characteristic.writeValueWithResponse(new Uint8Array(bytes));
    return null;
  }

  // Disconnect
  async Disconnect() {
    if (!this.device) {
      return;
    }
    console.log("Disconnecting...");

    this.device.gatt?.disconnect();
    await this.device?.forget();

    console.log("Cleanup...");
    this.characteristic = null;
    this.service = null;
    this.server = null;
    this.device = null;
  }

  getStatus(): ScooterState {
    return {
      scooter: this.device ? "CONNECTED" : "DISCONNECTED",
      server: this.server ? "CONNECTED" : "DISCONNECTED",
      service: this.service ? "CONNECTED" : "DISCONNECTED",
      characteristicData: this.characteristic ? "CONNECTED" : "DISCONNECTED",
    };
  }

  // Event Listener Logic

  addStateListener(callback: (state: ScooterState) => void) {
    this.onChange.push(callback);
  }

  removeStateListener(callback: (state: ScooterState) => void) {
    for (let i = 0; i < this.onChange.length; i++) {
      if (this.onChange[i] === callback) {
        this.onChange[i] = null;
      }
    }
  }

  private notifyChange() {
    const state = this.getStatus();
    this.onChange.forEach((func) => {
      if (func) {
        func(state);
      }
    });
  }
}
