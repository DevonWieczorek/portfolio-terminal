import { type FC } from "react";
import s from "../styles/Resume.less";

const Resume: FC = () => {
	return (
		<article className={s.resume}> 
			<header>
				<h1>Devon Wieczorek</h1>
				<h2>Senior Software Engineer</h2>
				<p>
					Tel: <a href="tel:2015277400">(201) 527-7400</a><br/>
					Email: <a href="mailto:Devon.Wieczorek@iCloud.com">Devon.Wieczorek@iCloud.com</a><br/>
					LinkedIn: <a href="http://LinkedIn.com/in/DevonWieczorek">LinkedIn.com/in/DevonWieczorek</a><br/>
					Github: <a href="http://github.com/DevonWieczorek">Github.com/DevonWieczorek</a><br/>
				</p>
			</header>

			<section>
				<h2>Professional Summary</h2>
				<p>
          Seasoned Senior Software Engineer with over 8 years of experience driving the success of diverse
          projects across the software development lifecycle. Known for adeptly translating stakeholder
          needs into actionable plans, mentoring emerging talent, and remaining at the forefront of cutting-edge technologies.
          Passionate about leveraging innovative solutions to optimize developer workflows and consumer experiences, 
          ensuring the delivery of exceptional outcomes.
				</p>
			</section>

			<section>
				<h2>Skills</h2>
				<ul>
					<li><strong>Languages:</strong> JavaScript/TypeScript, HTML, CSS, PHP, Python, Bash, Ruby</li>
					<li><strong>Technologies:</strong> React, React Router, Jest, Playwright, Tina CMS, NPM, Yarn, Node.js, Express.js, ES6+, Redux, LESS, SCSS, PostCSS, Material UI, Grommet, Bootstrap, WordPress, React Native, jQuery, GrapesJS, SurveyJS, HTML Emails, Selenium</li>
					<li><strong>Database:</strong> GraphQL, MySQL, Firebase, MongoDB</li>
					<li><strong>Build Tools/Environments:</strong> Webpack, Docker, Create React App, Jenkins, GitLab, Grunt, Gulp, Babel, AWS</li>
					<li><strong>Development Tools:</strong> VSCode, Chrome/React DevTools, GitHub Actions, Sequel Pro, GraphiQL</li>
					<li><strong>Design Tools:</strong> Figma, Adobe Photoshop, Adobe XD</li>
					<li><strong>Source Control:</strong> Git, GitHub, Perforce, GitLab</li>
					<li><strong>Development Lifecycle:</strong> Agile/Scrum, Monday, GitHub Documentation, Confluence, Asana, Jira</li>
					<li><strong>Operating Systems:</strong> Mac, Linux, Windows</li>
				</ul>
			</section>
  
			<section>
				<h2>Professional Experience</h2>
  
				<article>
					<h3>Senior Front End Engineer</h3>
					<p>Rockstar Games, New York City Metropolitan Area<br/>
					January 2023 – Present</p>
					<ul>
						<li>Built and released the website for Circoloco Records, showcasing advanced React capabilities.</li>
						<li>Assisted in converting the legacy Red Dead Redemption 2 site to React, improving performance and maintainability.</li>
						<li>Contributed to the migration from scattered repositories to a monolith codebase, streamlining the development process.</li>
						<li>Developed Jest tests for new components and converted legacy components to TypeScript, enhancing code quality.</li>
						<li>Provided continuous assistance and training for newer team members, serving as a knowledge resource.</li>
						<li>Distilled requests from internal stakeholders into concrete project requirements.</li>
					</ul>
				</article>

				<article>
					<h3>Digital Marketing Developer</h3>
					<p>Rockstar Games, New York City Metropolitan Area<br/>
					August 2020 – May 2023</p>
					<ul>
						<li>Developed and maintained a custom CMS that powers most content across web properties, increasing content management efficiency.</li>
						<li>Built and released the Grand Theft Auto Trilogy website and migrated legacy Grand Theft Auto V/Online websites.</li>
						<li>Led documentation efforts across the codebase and interviewed potential candidates.</li>
					</ul>
				</article>

				<article>
					<h3>Software Developer II</h3>
					<p>Fluent, Inc., Greater New York City Area<br/>
					May 2019 – August 2020</p>
					<ul>
						<li>Collaborated on a React-based WYSIWYG editor and marketing funnel builder, freeing up development resources.</li>
						<li>Developed reusable React components, utility functions, and SASS libraries for use across multiple projects.</li>
						<li>Created a Node-based CLI for bootstrapping, developing, and deploying microsites.</li>
					</ul>
				</article>

				<article>
					<h3>Front End Developer</h3>
					<p>Fluent, Inc., Greater New York City Area<br/>
					August 2017 – May 2019</p>
					<ul>
						<li>Architected custom CI/CD solutions for faster, more efficient development.</li>
						<li>Implemented git workflows in existing web projects.</li>
						<li>Led development on consumer content sites such as TheSmartWallet.com and FindDreamJobs.com.</li>
					</ul>
				</article>
			</section>

			<section>
				<h2>Education</h2>
				<p>
					Bachelor’s Degree, Communication and Media Studies<br/>
					Ramapo College of New Jersey, May 2016
				</p>
			</section>
		</article>
	);
};

export default Resume;