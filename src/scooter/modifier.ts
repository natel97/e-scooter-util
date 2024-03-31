export type ScooterModel = "MAX G2" | "F2/F2PLUS/F2PRO";

const G2_FAST_BYTES = [
  0x55, 0xab, 0x4d, 0x41, 0x58, 0x32, 0x53, 0x63, 0x6f, 0x6f, 0x74, 0x65, 0x72,
  0x5f, 0x31,
];
const G2_NORMAL_BYTES = [
  0x55, 0xab, 0x4d, 0x41, 0x58, 0x32, 0x53, 0x63, 0x6f, 0x6f, 0x74, 0x65, 0x72,
  0x5f, 0x30,
];

const F2_FAST_BYTES = [
  0x55, 0xab, 0x46, 0x32, 0x53, 0x63, 0x6f, 0x6f, 0x74, 0x65, 0x72, 0x5f, 0x31,
];

const F2_NORMAL_BYTES = [
  0x55, 0xab, 0x46, 0x32, 0x53, 0x63, 0x6f, 0x6f, 0x74, 0x65, 0x72, 0x5f, 0x30,
];

export type SCOOTER_SPEED = "fast" | "normal";

const getBytes = (speed: SCOOTER_SPEED, model: ScooterModel): Uint8Array => {
  const values: {
    [key in ScooterModel]: { [key in SCOOTER_SPEED]: Uint8Array };
  } = {
    "MAX G2": {
      fast: new Uint8Array(G2_FAST_BYTES),
      normal: new Uint8Array(G2_NORMAL_BYTES),
    },

    "F2/F2PLUS/F2PRO": {
      fast: new Uint8Array(F2_FAST_BYTES),
      normal: new Uint8Array(F2_NORMAL_BYTES),
    },
  };

  return values[model][speed];
};

export class ScooterModifier {
  constructor(
    private scooterModel: ScooterModel,
    private characteristic: BluetoothRemoteGATTCharacteristic
  ) {}

  async UpdateScooterState(speed: SCOOTER_SPEED): Promise<Error | null> {
    if (!this.characteristic.service.device.gatt?.connected) {
      return new Error("Device is null, please connect first");
    }

    const bytes = getBytes(speed, this.scooterModel);
    console.log("Writing bytes: ", speed, "for model: ", this.scooterModel);
    await this.characteristic.writeValueWithoutResponse(new Uint8Array(bytes));
    return null;
  }
}
