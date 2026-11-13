import NuevoPeritoForm from "./NuevoPeritoForm"

export default function NuevoPeritoPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Alta de perito</h1>
          <p>Registra un nuevo perito en el sistema con sus credenciales de acceso.</p>
        </div>
      </div>
      <NuevoPeritoForm />
    </>
  )
}
