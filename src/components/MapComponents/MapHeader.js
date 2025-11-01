import React from "react";
import Navbar from "../MainNavbars/Navbar";

function MapHeader() {
  return (
    <header style={{ position: "relative", zIndex: 1000 }}>
      <Navbar />
    </header>
  );
}

export default MapHeader;
