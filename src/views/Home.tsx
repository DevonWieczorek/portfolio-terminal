import React, { useState } from "react";
import Terminal from "../components/Terminal";
import s from "../styles/Home.less";
import "../styles/reset.less";

const Home: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string>("");

  return (
    <div className={s.home}>
      <Terminal onCommand={setSelectedOption} />
    </div>
  );
};

export default Home;
