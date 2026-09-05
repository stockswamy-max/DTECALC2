import "@/App.css";
import DTICalculator from "@/pages/DTICalculator";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <DTICalculator />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default App;
