import React, { useEffect, useState } from "react";
import { Button, ScooterOption, Text } from "./components";
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

const Disclaimer = ({ children }: { children: React.ReactNode }) => {
  const [page, setPage] = useState(0);

  if (page === 0) {
    return (
      <div>
        <div style={{ flex: 1 }}>
          <Text>
            This tool might increase the maximum speed of the following devices:
          </Text>
          <Text>Segway Ninebot Max G2 (Tested)</Text>
          <Text>Segway Ninebot F2, F2 Plus, or F2 Pro (Untested)</Text>
          <Text>
            Some regions, states, areas, etc. have regulations in place. While
            faster speeds might be legal on private property, you are
            responsible for knowing the laws of your area.
          </Text>
          <Text>
            By continuing, you acknowledge this and accept all responsibility
            for usage of this website.
          </Text>
        </div>
        <Button onClick={() => setPage(page + 1)}>Continue</Button>
      </div>
    );
  }
  if (page === 1) {
    return (
      <div>
        <div style={{ flex: 1 }}>
          <Text>
            Have you updated your scooter firmware to V1.3.1 or later? According
            to the document that referenced this, that is required. Please do
            that!
          </Text>
          <Text>
            Due to browser limitations, reading what your scooter is set to is
            broken 😔
          </Text>
          <Text>
            The testing of this utility was limited to a single case (OnePlus
            Android phone, Max G2 firmware V1.5.3). So results may vary. **You**
            are responsible for your use of this website.
          </Text>
          <Text>
            After changing the speed setting, you may need to drag the slider in
            "Settings" &gt; "Custom settings of S mode" for this change to take
            effect
          </Text>
        </div>
        <Button onClick={() => setPage(page + 1)}>Continue</Button>
      </div>
    );
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

  return (
    <div>
      {!connected && (
        <Button
          onClick={() =>
            connection.Connect().then((err) => setError(err?.message || ""))
          }
        >
          Search (name will be serial number)
        </Button>
      )}
      {connected && (
        <Button onClick={() => connection.Disconnect()}>Disconnect</Button>
      )}
      <ConnectionStatus device={state} />
      {error && <div>{error}</div>}
      {connected && children}
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
