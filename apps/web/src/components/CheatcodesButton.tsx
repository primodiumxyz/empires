const CheatcodesButton = () => {
  // vite + react in dev can't resolve multi-page routing
  const goToCheatcodes = () => window.open("/src/pages/cheatcodes.html", "_blank");

  return (
    <button
      className="absolute bottom-10 right-2 flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-sm bg-white opacity-70 transition-opacity hover:opacity-100"
      onClick={goToCheatcodes}
    >
      {/* <!--!Font Awesome Free 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--> */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="#000000">
        <path d="M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1-48 0zM64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64h384c35.3 0 64-28.7 64-64v-64c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm56 24a24 24 0 1 1 48 0 24 24 0 1 1-48 0z" />
      </svg>
    </button>
  );
};

export default CheatcodesButton;
