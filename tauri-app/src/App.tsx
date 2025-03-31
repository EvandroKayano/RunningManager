import { useState } from "react";
import { Stack, Button, Flex } from "@chakra-ui/react";
import "./App.css";
import NewRun from "./views/NewRun.tsx";
import Home from "./views/Home.tsx";
import EditRun from "./views/EditRun.tsx";

function App() {

  const [currentView, setCurrentView] = useState<string> ("NewRun");
  const maps:{[key:string]:JSX.Element} = {
    Home:<Home/>, // (setViewParams)
    NewRun:<NewRun/>,
    EditRun:<EditRun/>,
  };

  return (
    <Stack>
      <Flex>
        <Button onClick={()=>{setCurrentView("Home")}} width={"20%"}>Home</Button> 
        <Button onClick={()=>{setCurrentView("NewRun")}} width={"20%"}>NewRun</Button>
        <Button onClick={()=>{setCurrentView("EditRun")}} width={"20%"}>EditRun</Button>
      </Flex>


      {maps[currentView]}

    </Stack>
  );
}

export default App;
