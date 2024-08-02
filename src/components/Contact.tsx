import React from "react";
import s from "../styles/Contact.less";

const Contact: React.FC = () => {
  return (
    <div className={s.contact}>
      to contact devon, email him at&nbsp;
      <a 
        href="mailto:devon.wieczorek@icloud.com?subject=I%20Love%20Your%20Website!" 
        target="_blank" 
        rel="noreferrer"
      >
        devon.wieczorek@icloud.com
      </a>
    </div>
  );
};

export default Contact;
