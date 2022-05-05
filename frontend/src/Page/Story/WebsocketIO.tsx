import { Box, Grid, Input, Snackbar, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { atom, useRecoilState, useRecoilValue } from "recoil";
import { AsyncLoadingButton } from "../../Component/AsyncLoadingButton";
import { openDocument, RPCErrorWrapper, RPCMessageManager } from "../../Model/mod";

const manager: RPCMessageManager = new RPCMessageManager();

const returnMessageState = atom({
  key: "WebsocketIOReturnMessage",
  default: "",
});

function OpenDocumentForm() {
  const [file, setFile] = useState("");
  const [_, setReturnMessageState] = useRecoilState(returnMessageState);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Input value={file} onChange={(e) => setFile(e.target.value)} />
      </Grid>
      <Grid item xs={12}>
        <AsyncLoadingButton
          onClick={async () => {
            try {
              const doc = await openDocument(manager, file);
              setReturnMessageState(JSON.stringify(doc));
            } catch (e) {
              console.log(e);
              if (e instanceof RPCErrorWrapper) {
                setReturnMessageState(JSON.stringify(e));
              } else throw e;
            } finally {
              setFile("");
            }
          }}
        >
          Open
        </AsyncLoadingButton>
      </Grid>
    </Grid>
  );
}

function TabPanel(props: { children: React.ReactNode; value: number; index: number }) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function MessageSendForm() {
  return (
    <div>
      <Tabs value={0}>
        <Tab label="Send" />
      </Tabs>
      <TabPanel value={0} index={0}>
        <OpenDocumentForm />
      </TabPanel>
    </div>
  );
}
function MessageReceiveForm() {
  const returnMessage = useRecoilValue(returnMessageState);
  return (
    <div>
      {returnMessage}
    </div>
  );
}

export function WebsocketIO() {
  const [url, setUrl] = useState("ws://localhost:8000/ws");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);

  return (
    <div>
      <Box sx={{ maxWidth: 750, margin: "auto" }}>
        <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
        <AsyncLoadingButton
          onClick={async () => {
            if (!connected) {
              await tryConnect();
            } else {
              tryDisconnect();
            }
          }}
        >
          {connected ? "Disonnect" : "Connect"}
        </AsyncLoadingButton>
      </Box>
      {connected && (
        <Grid container columns={2}>
          <Grid item xs={6}>
            <MessageSendForm />
          </Grid>
          <Grid item xs={6}>
            <MessageReceiveForm />
          </Grid>
        </Grid>
      )}
      <Snackbar
        anchorOrigin={{ horizontal: "center", vertical: "top" }}
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        message={message}
      />
    </div>
  );
  async function tryConnect() {
    if (manager.opened) {
      manager.close();
    }
    try {
      await manager.open(url);
      setOpen(true);
      setMessage("Connected");
      setConnected(true);
    } catch (e) {
      setOpen(true);
      setMessage("Failed to connect");
      console.log(e);
      if (e instanceof Error) {
        setOpen(true);
        setMessage(e.message);
      }
    }
  }
  function tryDisconnect() {
    if (manager.opened) {
      manager.close();
    }
    setConnected(false);
    setMessage("Disconnected");
    setOpen(true);
  }
}
