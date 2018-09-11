import React from "react";

import AppProvider from "./containers/AppProvider";
import App from "./containers/App";

test("Rendering AppProvider should not throw errors", () => {
    expect(<AppProvider component={App} />).toBeTruthy();
});
