import './App.css'
import logo from './assets/logo3.png'

function App() {
  
  return (
    <>
      <div className="h-screen flex flex-col justify-center items-center text-center gap-4">
      
      <img src={logo} alt="Logo" className="w-32 h-32 object-contain" />

      <h1 className="text-4xl font-bold">
        Valeur Delivery Admin
      </h1>
    </div>
    </>
  )
}

export default App
