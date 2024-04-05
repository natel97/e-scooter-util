import { ScooterModel, ScooterModifier } from "./scooter/modifier";

const SERVICE = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const CHARACTERISTIC = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

function withTimeout<T>(timeout = 5000, func: Promise<T>): Promise<T> {
  return Promise.race([
    func,
    new Promise((_, rej) => setTimeout(() => rej("Timeout occurred"), timeout)),
  ]) as Promise<T>;
}

export type ScooterState = {
  scooterConnection: "CONNECTED" | "DISCONNECTED";
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

  // TODO: If we can fetch current state of characteristic.
  private set currentValueState(val: DataView | null) {
    this._currentValueState = val;
    this.notifyChange();
  }

  private get setCurrentValueState() {
    return this._currentValueState;
  }

  // Connection Details
  public async Connect(
    updateStatus: (val: string) => void
  ): Promise<Error | null> {
    const updateAndLog = (connectionMessage: string) => {
      console.log({ connectionMessage });
      updateStatus(connectionMessage);
    };

    try {
      updateAndLog("Searching for device...");
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE] }],
      });
      if (!this.device.gatt) {
        return new Error("GATT service unreachable");
      }

      updateAndLog("Attempting to connect to " + this.device.name);
      this.server = await withTimeout(10_000, this.device.gatt.connect());
      if (!this.server) {
        return new Error("Failed to connect to server");
      }

      this.device.addEventListener("gattserverdisconnected", () => {
        this.characteristic = null;
        this.service = null;
        this.server = null;
        updateAndLog("Service disconnected");
      });

      updateAndLog("Fetching needed service...");
      this.service = await withTimeout(
        5000,
        this.server.getPrimaryService(SERVICE)
      );
      if (!this.service) {
        return new Error("Service is null");
      }

      this.service.getCharacteristics().then(console.log);

      updateAndLog("Fetching Scooter Characteristic Data...");
      this.characteristic = await withTimeout(
        4000,
        this.service.getCharacteristic(CHARACTERISTIC)
      );
      if (!this.characteristic) {
        return new Error("Characteristic is null");
      }
    } catch (error: unknown) {
      console.log(error);
      return error as Error;
    }
    updateAndLog("Connected! :D");

    return null;
  }

  // Disconnect
  async Disconnect(): Promise<void> {
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
      scooterConnection: this.server ? "CONNECTED" : "DISCONNECTED",
      service: this.service ? "CONNECTED" : "DISCONNECTED",
      characteristicData: this.characteristic ? "CONNECTED" : "DISCONNECTED",
    };
  }

  // Event Listener Logic
  addStateListener(callback: (state: ScooterState) => void): void {
    this.onChange.push(callback);
  }

  removeStateListener(callback: (state: ScooterState) => void): void {
    for (let i = 0; i < this.onChange.length; i++) {
      if (this.onChange[i] === callback) {
        this.onChange[i] = null;
      }
    }
  }

  private notifyChange(): void {
    const state = this.getStatus();
    this.onChange.forEach((func) => {
      if (func) {
        func(state);
      }
    });
  }

  getScooterModifier(model: ScooterModel): Error | ScooterModifier {
    if (!this.characteristic || !this.device?.gatt?.connected) {
      return new Error("Scooter not connected");
    }

    return new ScooterModifier(model, this.characteristic);
  }
}
