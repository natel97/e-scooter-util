import React, { useEffect, useRef, useState } from "react";
import { Button, Loading, ScooterOption, Text } from "./components";
import { ScooterConnection, ScooterState } from "./connection";
import { ScooterModifier, ScooterModel } from "./scooter/modifier";

const ConnectionStatus = ({
  device,
}: {
  device: Partial<{ [key: string]: string }>;
}) => {
  return (
    <table style={{ width: "100%" }}>
      <tbody>
        {Object.keys(device).map((key) => (
          <tr key={key}>
            <td>{key}</td>
            <td>{device[key]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const DisclaimerText1 = ({ onClick }) => (
  <div>
    <div style={{ flex: 1 }}>
      <Text>
        This tool might increase the maximum speed of the following devices:
      </Text>
      <Text>Segway Ninebot Max G2 (Tested)</Text>
      <Text>Segway Ninebot F2, F2 Plus, or F2 Pro (Untested)</Text>
      <Text>
        Some regions, states, areas, etc. have regulations in place. While
        faster speeds might be legal on private property, you are responsible
        for knowing the laws of your area.
      </Text>
      <Text>
        By continuing, you acknowledge this and accept all responsibility for
        usage of this website.
      </Text>
    </div>
    <Button onClick={onClick}>Continue</Button>
  </div>
);

const DisclaimerText2 = ({ onClick }) => (
  <div>
    <div style={{ flex: 1 }}>
      <Text>
        Have you updated your scooter firmware to V1.3.1 or later? According to
        the document that referenced this, that is required. Please do that!
      </Text>
      <Text>
        Due to browser limitations, reading what your scooter is set to is
        broken 😔
      </Text>
      <Text>
        The testing of this utility was limited to a single case (OnePlus
        Android phone, Max G2 firmware V1.5.3). So results may vary. **You** are
        responsible for your use of this website.
      </Text>
      <Text>
        After changing the speed setting, you may need to drag the slider in
        "Settings" &gt; "Custom settings of S mode" for this change to take
        effect
      </Text>
    </div>
    <Button onClick={onClick}>Continue</Button>
  </div>
);

const IncompatibleScreen = () => (
  <div style={{ flex: 1 }}>
    <Text>
      Your device, browser, and/or operating system is not compatible with this
      website due to{" "}
      <a href="https://caniuse.com/web-bluetooth">bluetooth requirements</a>.
      Please try again in a different browser or device.
    </Text>
  </div>
);

const Disclaimer = ({ children }: { children: React.ReactNode }) => {
  const [page, setPage] = useState(navigator.bluetooth ? 1 : 0);

  if (page === 0) {
    return <IncompatibleScreen />;
  }
  if (page === 1) {
    return <DisclaimerText1 onClick={() => setPage((p) => p + 1)} />;
  }
  if (page === 2) {
    return <DisclaimerText2 onClick={() => setPage((p) => p + 1)} />;
  }

  return children;
};

const ScooterConnectionScreen = ({
  connection,
  children,
  state,
}: {
  connection: ScooterConnection;
  children: React.ReactNode;
  state: ScooterState;
}) => {
  const [error, setError] = useState<string>("");
  const connected = state.scooterConnection === "CONNECTED";
  const ref = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (!navigator.bluetooth) {
      setError(
        "Bluetooth is not supported in this browser. Please try again in another browser or device."
      );
    }
  }, []);

  useEffect(() => {
    if (ref.current === null) {
      return;
    }

    ref.current.showModal();
  }, [error]);

  return (
    <div>
      {!connected && (
        <Button
          onClick={() => {
            setLoading(true);
            connection
              .Connect((str) => setLoadingMessage((msgs) => [...msgs, str]))
              .then((err) => {
                setError(err?.message || "");
                if (err) {
                  setLoadingMessage((msgs) => [
                    ...msgs,
                    "Error: " + err.message,
                  ]);
                }
                setLoading(false);
              });
          }}
        >
          Search (name will be serial number)
        </Button>
      )}
      {connected && (
        <Button onClick={() => connection.Disconnect()}>Disconnect</Button>
      )}
      <ConnectionStatus device={state} />
      {error && (
        <dialog ref={ref}>
          <Text>{error}</Text>
          <Button autoFocus onClick={() => ref.current?.close()}>
            OK
          </Button>
        </dialog>
      )}
      {connected && children}
      {loading && <Loading />}
      <button onClick={() => setShowLogs((cur) => !cur)}>
        {showLogs ? "Hide" : "Show"} Connection Logs
      </button>
      {showLogs && (
        <div>
          <div>Logs</div>
          {loadingMessage.map((msg) => (
            <div>{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const ScooterModifierScreen = ({ scooter }: { scooter: ScooterModifier }) => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (message !== "") {
      const timeout = setTimeout(() => setMessage(""), 7000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  return (
    <div>
      {message && <div>{message}</div>}
      <Button
        onClick={() =>
          scooter
            .UpdateScooterState("fast")
            .then(() => setMessage("Updated speed to fast"))
        }
      >
        Set Fast Speed
      </Button>
      <Button
        onClick={() =>
          scooter
            .UpdateScooterState("normal")
            .then(() => setMessage("Updated speed to normal"))
        }
      >
        Set Normal Speed
      </Button>
    </div>
  );
};

const ScooterModelSelector = ({
  model,
  setModel,
}: {
  model?: ScooterModel;
  setModel: React.Dispatch<ScooterModel | undefined>;
}) => {
  const [changeModel, setChangeModel] = useState(false);
  const options: { [key: string]: ScooterModel } = {
    "Ninebot Max G2": "MAX G2",
    "Ninebot F2, F2 Plus, or F2 Pro": "F2/F2PLUS/F2PRO",
  };

  if (model && !changeModel) {
    return (
      <div style={{ flex: "1" }}>
        <Text>
          {model}{" "}
          <button onClick={() => setChangeModel(true)}>Change Model</button>
        </Text>
      </div>
    );
  }

  return (
    <div>
      <Text>Select your scooter</Text>
      {Object.keys(options).map((name) => (
        <ScooterOption
          selected={model === options[name]}
          onClick={() => {
            setModel(options[name]);
            setChangeModel(false);
          }}
        >
          {name}
        </ScooterOption>
      ))}
    </div>
  );
};

const App = () => {
  const [scooter, setScooter] = useState<ScooterModifier>();
  const [model, setModel] = useState<ScooterModel>();
  const [error, setError] = useState<string>("");
  const [connection] = useState<ScooterConnection>(new ScooterConnection());
  const [scooterState, setScooterState] = useState<ScooterState>({
    characteristicData: "DISCONNECTED",
    scooterConnection: "DISCONNECTED",
    service: "DISCONNECTED",
  });

  useEffect(() => {
    if (scooterState.service === "CONNECTED") return;

    setError("");
    setModel(undefined);
    setScooter(undefined);
  }, [scooterState.service]);

  useEffect(() => {
    if (!model) {
      setError("Scooter model not selected");
      return;
    }

    if (scooterState.service === "DISCONNECTED") {
      setError("Scooter is disconnected");
      return;
    }

    const modifier = connection.getScooterModifier(model);
    if (modifier instanceof Error) {
      console.error(modifier);
      setError(modifier.message);
      return;
    }

    setError("");
    setScooter(modifier);
  }, [model, connection, scooterState.service]);

  useEffect(() => {
    const changeState = (state: ScooterState) => setScooterState(state);
    connection.addStateListener(changeState);
    return () => {
      connection.removeStateListener(changeState);
      connection.Disconnect();
    };
  }, [connection]);

  return (
    <Disclaimer>
      <ScooterConnectionScreen state={scooterState} connection={connection}>
        <ScooterModelSelector model={model} setModel={setModel} />
        {error && <Text>{error}</Text>}
        {scooter && <ScooterModifierScreen scooter={scooter} />}
      </ScooterConnectionScreen>
    </Disclaimer>
  );
};

export default App;
