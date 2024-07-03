import React from "react";
import ReactDOM from "react-dom/client";

import "src/index.css";

/* -------------------------------------------------------------------------- */
/*                                 CHEATCODES                                 */
/* -------------------------------------------------------------------------- */

const Cheatcodes = () => {
  return (
    <div>
      <h1>Cheatcodes</h1>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   RENDER                                   */
/* -------------------------------------------------------------------------- */

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Cheatcodes />
  </React.StrictMode>,
);
