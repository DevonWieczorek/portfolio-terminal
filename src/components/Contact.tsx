import React from "react";
import s from "../styles/Contact.less";

const Contact: React.FC = () => {
  return (
    <div className={s.contact}>
      <div>
        To contact devon, email him at&nbsp;
        <a 
          href="mailto:devon.wieczorek@icloud.com?subject=I%20Love%20Your%20Website!" 
          target="_blank" 
          rel="noreferrer"
        >
          devon.wieczorek@icloud.com
        </a>.
      </div>
      <div>
        You can also view some of Devon's projects on his&nbsp;
        <a 
          href="https://github.com/DevonWieczorek"
          target="_blank" 
          rel="noreferrer"
          >
            Github
          </a>
      </div>
    </div>
  );
};

export default Contact;
