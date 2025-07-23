"use client";

import { useState, useEffect } from "react";
import Terminal from "@/components/Terminal";
import R3FScene from "@/components/R3FScene";
import styles from "@/styles/Home.module.css";

export default function Home() {
        const [, setSelectedOption] = useState<string>("");
        const [isDesktop, setIsDesktop] = useState<boolean>(false);

        useEffect(() => {
                const mq = window.matchMedia("(min-width: 768px)");
                const handle = () => setIsDesktop(mq.matches);
                handle();
                mq.addEventListener("change", handle);
                return () => mq.removeEventListener("change", handle);
        }, []);

        return (
                <div className={styles.home}>
                        {isDesktop ? (
                                <R3FScene />
                        ) : (
                                <Terminal onCommand={setSelectedOption} />
                        )}
                </div>
        );
}
