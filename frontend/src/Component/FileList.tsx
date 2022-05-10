import { Button, Divider, Drawer, List, ListItem } from "@mui/material";

const dummyList = [
  "test.syd",
  "aaa.md",
  "consol",
];

// placeholder
export default function FileList(props: {
  width: number;
  open: boolean;
  onClose: () => void;
  onClick: (path: string) => void;
}) {
  const onClose = () => {
    props.onClose();
  };

  const onClick = (event) => {
    props.onClick(event.target.textContent);
  };

  return (
    <Drawer
      sx={{
        width: props.width,
      }}
      variant="persistent"
      anchor="left"
      open={props.open}
    >
      <Button onClick={onClose}>
        Close
      </Button>
      <Divider />

      <List>
        {dummyList.map((f, i) => <ListItem key={i} button onClick={onClick}>{f}</ListItem>)}
      </List>
    </Drawer>
  );
}
