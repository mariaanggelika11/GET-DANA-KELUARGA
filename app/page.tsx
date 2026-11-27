import Landing from "./site/Landing";
export default function Home() {
  const configured = process.env.GOOGLE_PLAY_URL;
  let googlePlayUrl = "";
  try {
    if (configured) {
      const url = new URL(configured);
      if (
        url.protocol === "https:" &&
        url.hostname === "play.google.com" &&
        !url.username &&
        !url.password
      )
        googlePlayUrl = url.toString();
    }
  } catch {}
  return <Landing googlePlayUrl={googlePlayUrl} />;
}
