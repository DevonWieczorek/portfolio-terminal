"use client";

import { useState, useEffect, type FC } from "react";

// TODO: get fun facts from GPT or have them both pull from a single source

const initialFunFacts = [
    "In addition to his interest in coding, Devon is also a huge film buff! He attended the New York Film Academy for producing in 2012.",
    "Devon once owned and ran his own skateboarding company, Brew Crew Skateboards, with his brother and cousin.",
    "Devon is also a musician! He plays the bass and is a vocalist in the punk rock band, Friend Z.",
    "Devon loves to travel! He enjoys seeing all the world has to offer and wants to see every country he possibly can.",
];

const FunFact: FC = () => {
    const [currentFact, setCurrentFact] = useState<string | null>(null);
    const [, setFunFacts] = useState(initialFunFacts);

    useEffect(() => {
        setFunFacts(prevFacts => {
            const availableFacts =
                prevFacts.length > 0 ? prevFacts : initialFunFacts;
            const randomIndex = Math.floor(
                Math.random() * availableFacts.length
            );
            const selectedFact = availableFacts[randomIndex];
            setCurrentFact(selectedFact);
            return availableFacts.filter((_, index) => index !== randomIndex);
        });
    }, []); // Only run once on mount

    return (
        <div>
            <div>Devon Fun Fact:</div>
            <div>{currentFact}</div>
        </div>
    );
};

export default FunFact;
