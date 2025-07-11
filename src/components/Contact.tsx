"use client";

import { type FC } from "react";
import styles from "@/styles/Contact.module.css";

const Contact: FC = () => {
	return (
		<div className={styles.contact}>
			<div>
				To contact devon, email him at&nbsp;
				<a
					href="mailto:devon.wieczorek@icloud.com?subject=I%20Love%20Your%20Website!"
					target="_blank"
					rel="noreferrer"
				>
					devon.wieczorek@icloud.com
				</a>
				.
			</div>
			<div>
				You can also view some of Devon&apos;s projects on his&nbsp;
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
