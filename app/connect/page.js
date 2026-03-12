export default function Connect() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>🏃 Connecter Strava</h1>
      <p>Cliquez pour autoriser l'accès à vos activités Strava</p>
      <a href="/api/auth/strava" style={{
        display: 'inline-block',
        marginTop: '1rem',
        padding: '1rem 2rem',
        background: '#FC4C02',
        color: 'white',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '1.1rem'
      }}>
        Se connecter avec Strava
      </a>
    </main>
  )
}