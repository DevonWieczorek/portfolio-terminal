
import React, { useState } from "react";

const funFacts = [
    "In addition to his interest in coding, Devon is also a huge film buff! He attended the New York Film Academy for producing in 2012.",
	"Devon once owned and ran his own skateboarding company, Brew Crew Skateboards, with his brother and cousin.",
	"Devon is also a musician! He plays the bass and is a vocalist in the punk rock band, Friend Z.",
	"Devon loves to travel! He enjoys seeing all the world has to offer and wants to see every country he possibly can.",
  ];

const FunFact: React.FC = () => {
  const randomIndex = Math.floor(Math.random() * funFacts.length);

  return (
    <div>
		<div>Devon Fun Fact:</div>
		<div>{funFacts[randomIndex]}</div>
	</div>
  );
};

export default FunFact;
