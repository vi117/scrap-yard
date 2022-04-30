import { RecoilRoot } from "recoil";
import "./App.css";
import Document from "./Component/Document";

function App() {
  return (
    <RecoilRoot>
      <div className="App">
        <header className="App-header"></header>
        <Document></Document>
      </div>
    </RecoilRoot>
  );
}

export default App;
