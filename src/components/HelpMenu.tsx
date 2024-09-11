const HelpMenu = () => (
    <div style={{display: 'grid', gridGap: 'var(--grid-gap)'}}>
      <p>commands:</p>
      <p>resume: displays plain-text version of Devon's resume</p>
      <p>contact: find out where to reach Devon</p>
      <p>ask: asks AI Devon a question</p>
      <p>fun-fact: displays a random "fun fact" about Devon</p>
      <p>clear: clear the console</p>
      <p>help: displays this menu</p>
    </div>
  );

  export default HelpMenu;