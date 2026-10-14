import NuevoColegiadoForm from "./NuevoColegiadoForm"

export default function NuevoColegiadoPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Alta de colegiado</h1>
          <p>Crea una cuenta nueva en el padrón. Se enviará un correo con las credenciales de acceso.</p>
        </div>
      </div>
      <NuevoColegiadoForm />
    </>
  )
}
