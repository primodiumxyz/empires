type Song = {
  title: string;
  artist: string;
  url: string;
};

export const playlist: Song[] = [
  {
    title: "Aurora",
    artist: "DaniHaDani",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Aurora+by+DaniHaDani.mp3`,
  },
  {
    title: "Gravity",
    artist: "Downtown Binary",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Gravity+by+Downtown+Binary.mp3`,
  },
  {
    title: "Isolation",
    artist: "Linus Johnsson",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Isolation+by+Linus+Johnsson.mp3`,
  },
  {
    title: "No One Is Out Here",
    artist: "Yehezkel Raz",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/No+One+Is+Out+Here+by+Yehezkel+Raz.mp3`,
  },
  {
    title: "Particles",
    artist: "Nobou",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Nobou+Particles.mp3`,
  },
  {
    title: "Offworld",
    artist: "Downtown Binary",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Offworld+by+Downtown+Binary.mp3`,
  },
  {
    title: "No Reason Why",
    artist: "Oran Loyfer",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Oran+Loyfer+No+Reason+Why.mp3`,
  },
  {
    title: "Quiet Pull",
    artist: "Tamuz Dekel",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Quiet+Pull+Tamuz+Dekel.mp3`,
  },
  {
    title: "Silent Dreams",
    artist: "Nobou",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Silent+Dreams+by+Nobou.mp3`,
  },
  {
    title: "Silent Transmissions",
    artist: "Tamuz Dekel",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Silent+Transmission+by+Tamuz+Dekel.mp3`,
  },
  {
    title: "The Labyrinth",
    artist: "DaniHaDani",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Silent+Transmission+by+Tamuz+Dekel.mp3`,
  },
  {
    title: "Digital Abyss",
    artist: "Stephen Keech",
    url: `https://primodium-assets.s3.us-west-2.amazonaws.com/music/Digital+Abyss+by+Stephen+Keech.mp3`,
  },
];

export const getRandomSong = () => {
  return playlist[Math.floor(Math.random() * playlist.length)];
};

export const getNextSong = (currentSong: Song) => {
  const index = playlist.indexOf(currentSong);
  if (index === playlist.length - 1) {
    return playlist[0];
  }
  return playlist[index + 1];
};

export const getPrevSong = (currentSong: Song) => {
  const index = playlist.indexOf(currentSong);
  if (index === 0) {
    return playlist[playlist.length - 1];
  }
  return playlist[index - 1];
};
