export default function Privacy() {
  return (
    <div className="narrow stack">
      <h1>How your privacy works</h1>
      <p className="muted">The short version: your data is locked on your device before it ever reaches us, and only your password can unlock it.</p>

      <section className="card">
        <h2>What happens when you log a day</h2>
        <ol>
          <li>Your password is turned into encryption keys <strong>in your browser</strong>. The password itself is never sent anywhere.</li>
          <li>Each day you log (bleeding, pain, symptoms, notes <em>and the date itself</em>) is encrypted with AES-256 before it leaves your device.</li>
          <li>Our server stores scrambled text with a random-looking label. It can’t tell which day an entry is for, or what’s in it.</li>
          <li>Your predictions, insights and doctor report are all worked out on your device, not on our server.</li>
        </ol>
      </section>

      <section className="card">
        <h2>What we store, and what we don’t</h2>
        <ul>
          <li><strong>We store:</strong> your username, a scrambled check that you know your password, and your encrypted entries.</li>
          <li><strong>We never ask for:</strong> your email, phone number, real name, birthday or location.</li>
          <li><strong>We don’t keep:</strong> timestamps of when you log, request logs, analytics or advertising trackers.</li>
          <li><strong>We never</strong> sell, rent or share data. There’s no business in it for us, and we couldn’t read it anyway.</li>
        </ul>
      </section>

      <section className="card">
        <h2>The two things you choose to share</h2>
        <ul>
          <li><strong>People links</strong> are encrypted too. The key lives after the # in the link, and browsers never send that part to a server.</li>
          <li><strong>Calendar sync</strong> is the one exception. Google and Apple Calendar can’t decrypt things, so if you turn on sync, the predicted dates (with the event title you pick) are published at a private, unguessable address. It’s off by default, and turning it off deletes it.</li>
        </ul>
      </section>

      <section className="card">
        <h2>The trade-off</h2>
        <p>Because we can’t read your data, we also can’t reset your password. Keep it somewhere safe, and use <strong>Settings → Export</strong> now and then for a backup.</p>
        <p style={{ margin: 0 }}>Deleting your account removes everything from our server immediately. There’s no 30-day “are you sure” holding period.</p>
      </section>
    </div>
  );
}
