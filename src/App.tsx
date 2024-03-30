import { useEffect, useRef, useState } from "react";
import { Button, Text } from "./components";
import { ScooterConnection, ScooterState } from "./connection";

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

const Disclaimer = ({ children }) => {
  const [page, setPage] = useState(0);

  if (page === 0) {
    return (
      <div>
        <Text>
          Some regions, states, areas, etc. have regulations in place. While
          using unlocked speed limits may be legal on private property, you are
          responsible for knowing the laws of your area.
        </Text>
        <Text>
          By continuing, you acknowledge this and accept all responsibility for
          usage of this website.
        </Text>
        <Button onClick={() => setPage(page + 1)}>Continue</Button>
      </div>
    );
  }
  if (page === 1) {
    return (
      <div>
        <Text>Have you updated your firmware to V1.3.1 or later?</Text>
        <Text>
          Due to browser limitations, reading what your scooter is set to is
          broken :( Updating the setting seemed to work using an Android,
          OnePlus 10 Pro
        </Text>
        <Text>
          Note: While this was tested on a Segway Ninebot Max G2 on V1.5.3,
          results are not guarenteed. Only **you** are responsible for use of
          this website.
        </Text>
        <Button onClick={() => setPage(page + 1)}>Continue</Button>
      </div>
    );
  }

  return children;
};

const App = () => {
  const [error, setError] = useState<string>("");
  const scooter = useRef<ScooterConnection>(new ScooterConnection());
  const [state, setState] = useState<Partial<ScooterState>>({});
  const connected = state.server === "CONNECTED";
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (message !== "") {
      const timeout = setTimeout(() => setMessage(""), 7000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  useEffect(() => {
    const changeState = (state: ScooterState) => setState(state);
    const currentRef = scooter.current;
    currentRef.addStateListener(changeState);
    return () => currentRef.removeStateListener(changeState);
  }, []);

  return (
    <Disclaimer>
      {!connected && (
        <Button
          onClick={() =>
            scooter.current
              .Connect()
              .then((err) => setError(err?.message || ""))
          }
        >
          Search (name will be serial number)
        </Button>
      )}
      {connected && (
        <Button onClick={() => scooter.current.Disconnect()}>Disconnect</Button>
      )}
      <ConnectionStatus device={state} />
      {error && <div>{error}</div>}
      {connected && (
        <Button
          onClick={() =>
            scooter.current
              .UpdateScooterState("fast")
              .then(() => setMessage("Updated speed to fast"))
          }
        >
          Set Fast Speed
        </Button>
      )}
      {connected && (
        <Button
          onClick={() =>
            scooter.current
              .UpdateScooterState("normal")
              .then(() => setMessage("Updated speed to normal"))
          }
        >
          Set Normal Speed
        </Button>
      )}
      {message && <div>{message}</div>}
    </Disclaimer>
  );
};

export default App;
