export default function ErrorOperacion({ error }) {
  if (!error) return null
  return <div className="alert alert-danger" role="alert">
    <p className="mb-1">{error.message}</p>
    {Object.keys(error.campos ?? {}).length > 0 && <ul className="mb-0">
      {Object.entries(error.campos).map(([campo, mensaje]) => <li key={campo}><strong>{campo}:</strong> {String(mensaje)}</li>)}
    </ul>}
  </div>
}
