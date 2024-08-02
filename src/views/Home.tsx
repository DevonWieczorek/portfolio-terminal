// src/views/Home.tsx

import React, { useState } from "react";
import Terminal from "../components/Terminal";
// import Resume from "../components/Resume";
import Contact from "../components/Contact";
import AskGPT from "../components/AskGPT";
import s from "../styles/Home.less";
import "../styles/reset.less";

const Home: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>("");

  // const renderComponent = () => {
  //   switch (selectedOption) {
  //     case "resume":
  //       return "TODO: add resume";
  //     case "contact":
  //       return <Contact />;
  //     case "ask":
  //       return <AskGPT />;
  //     default:
  //       return null;
  //   }
  // };

  return (
    <div className={s.home}>
      <Terminal onCommand={setSelectedOption} />
      {/* <div className={s.homeContent}>{renderComponent()}</div> */}
    </div>
  );
};

export default Home;
