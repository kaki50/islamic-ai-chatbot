export default function PrivacyPage() {
  return (
    <main
      style={{
        maxWidth: "760px",
        margin: "0 auto",
        padding: "32px 20px 60px",
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: "#22302a",
        lineHeight: 1.65,
      }}
    >
      <a href="/" style={{ color: "#0d7a55", fontSize: "14px" }}>
        ← Back to Islamic AI Chatbot
      </a>
      <h1 style={{ color: "#0b5c40", marginTop: "18px" }}>Privacy Policy</h1>
      <p style={{ color: "#68766c", fontSize: "14px" }}>Last updated: October 23, 2026</p>

      <h2 style={{ color: "#0b5c40" }}>What we collect</h2>
      <p>
        <strong>Account email (optional).</strong> If you create an account, we store
        your email address so you can sign in and sync your chats across devices. Guests
        can use the service without an account.
      </p>
      <p>
        <strong>Your chats.</strong> Conversations are stored in your own browser. If
        you sign in, your chats are also saved to your account so they appear on your
        other devices.
      </p>
      <p>
        <strong>Usage counts.</strong> We count questions per day to apply the free
        plan limit. For guests this uses a hashed (scrambled) version of the IP address;
        we do not store the raw address for this purpose.
      </p>
      <p>
        <strong>Payments.</strong> Payments are processed by Creem as merchant of
        record. We never receive or store your card number or other card details.
      </p>

      <h2 style={{ color: "#0b5c40" }}>How we use it</h2>
      <p>
        Your information is used only to provide the service: answering your questions,
        signing you in, syncing your chats, applying plan limits, and activating
        Premium. We do not sell your personal information.
      </p>

      <h2 style={{ color: "#0b5c40" }}>Service providers</h2>
      <p>
        We rely on a small number of providers to run the service: Supabase (database
        and accounts), OpenAI (generating answers from the retrieved sources), Vercel
        (website hosting), and Creem (payments). Each receives only the data needed to
        perform its role.
      </p>

      <h2 style={{ color: "#0b5c40" }}>Your choices</h2>
      <p>
        You can delete individual chats at any time from the sidebar. To delete your
        account and its saved data, contact us at jaamhouse9900@gmail.com and we will
        remove it.
      </p>

      <h2 style={{ color: "#0b5c40" }}>Contact</h2>
      <p>
        Questions about privacy: jaamhouse9900@gmail.com
      </p>
    </main>
  );
}
