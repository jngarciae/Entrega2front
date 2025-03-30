import React, { useState } from "react";

function Spinner() {
  return (
    <>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.spinner}></div>
    </>
  );
}

function App() {
  // Modo de entrada: true = JSON, false = TextArea
  const [useJson, setUseJson] = useState(false);

  // State para el modo de texto
  const [newsTexts, setNewsTexts] = useState([""]);
  // State para el modo JSON
  const [jsonData, setJsonData] = useState(null);

  const [predictions, setPredictions] = useState([]);
  const [predictError, setPredictError] = useState("");
  const [predictLoading, setPredictLoading] = useState(false);

  // State para retrain
  const [csvFile, setCsvFile] = useState(null);
  const [retrainResult, setRetrainResult] = useState(null);
  const [retrainError, setRetrainError] = useState("");
  const [retrainLoading, setRetrainLoading] = useState(false);

  // State para reset
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Handler para cambiar entre modo Texto y JSON
  const handleSwitchChange = () => {
    setUseJson(!useJson);
    // Limpiar estados correspondientes
    setNewsTexts([""]);
    setJsonData(null);
  };

  // Handler para actualizar texto en el modo Texto
  const handleNewsTextChange = (index, value) => {
    const newNewsTexts = [...newsTexts];
    newNewsTexts[index] = value;
    setNewsTexts(newNewsTexts);
  };

  // Handler para agregar otro campo de texto
  const addNewsTextField = () => {
    setNewsTexts([...newsTexts, ""]);
  };

  // Handler para cargar archivo JSON
  const handleJsonUpload = (e) => {
    setPredictError(""); 
    const file = e.target.files[0];
    if (!file) return;
    // Solo permitir archivos con extensión .json
    if (!file.name.toLowerCase().endsWith(".json")) {
      setPredictError("Por favor, sube un archivo con extensión .json.");
      setJsonData(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        setJsonData(parsed);
      } catch (error) {
        setPredictError("El archivo JSON está mal formado. Corrige el formato e inténtalo de nuevo.");
        setJsonData(null);
      }
    };
    reader.readAsText(file);
  };

  // Handler para predecir
  const handlePredict = async (e) => {
    e.preventDefault();
    setPredictError("");
    setPredictions([]);
    let instances = [];
    if (useJson) {
      if (!jsonData) {
        setPredictError("Por favor, sube un archivo JSON válido.");
        return;
      }
      // Se asume que el JSON es un array de objetos con la propiedad "text"
      let tempArray = jsonData.instances
      if (!Array.isArray(tempArray)) {
        setPredictError("El JSON debe ser un arreglo de instancias.");
        return;
      }
      instances = tempArray.filter(item => item.text && item.text.trim() !== "");
    } else {
      if (newsTexts.filter(text => text.trim() !== "").length === 0) {
        setPredictError("Por favor, ingresa al menos un texto de noticia.");
        return;
      }
      instances = newsTexts
        .filter(text => text.trim() !== "")
        .map(text => ({ text }));
    }
    setPredictLoading(true);
    try {
      console.log("wut",JSON.stringify({ instances }))
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instances }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al predecir el texto");
      }
      const data = await response.json();
      setPredictions(data);
    } catch (error) {
      setPredictError(error.message);
    } finally {
      setPredictLoading(false);
    }
  };

  // Handler para reentrenar el modelo
  const handleRetrain = async (e) => {
    e.preventDefault();
    setRetrainError("");
    setRetrainResult(null);
    if (!csvFile) {
      setRetrainError("Por favor, sube un archivo CSV.");
      return;
    }
    setRetrainLoading(true);
    const formData = new FormData();
    formData.append("file", csvFile);
    try {
      const response = await fetch("http://localhost:8000/retrain", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al reentrenar el modelo");
      }
      const data = await response.json();
      setRetrainResult(data);
    } catch (error) {
      setRetrainError(error.message);
    } finally {
      setRetrainLoading(false);
    }
  };

  // Handler para reiniciar el modelo
  const handleReset = async () => {
    setResetError("");
    setResetMessage("");
    setResetLoading(true);
    try {
      const response = await fetch("http://localhost:8000/reset", {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al reiniciar el modelo");
      }
      const data = await response.json();
      setResetMessage(data.mensaje || "Modelo reiniciado exitosamente.");
    } catch (error) {
      setResetError(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Fake News Detector</h1>
      {/* Switch para seleccionar modo de entrada */}
      <div style={styles.switchContainer}>
        <label style={styles.switchLabel}>
          <input
            type="checkbox"
            checked={useJson}
            onChange={handleSwitchChange}
            style={styles.switchInput}
          />
          Modo JSON
        </label>
      </div>

      {/* Sección de Predicción */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Predecir Noticias Falsas</h2>
        <form onSubmit={handlePredict} style={styles.form}>
          {useJson ? (
            <div style={styles.formGroup}>
              <label htmlFor="jsonFile" style={styles.label}>
                Subir Archivo JSON
              </label>
              <input
                id="jsonFile"
                type="file"
                accept=".json"
                onChange={handleJsonUpload}
                style={styles.fileInput}
              />
            </div>
          ) : (
            <>
              {newsTexts.map((text, index) => (
                <div key={index} style={styles.formGroup}>
                  <label htmlFor={`newsText-${index}`} style={styles.label}>
                    Texto de Noticia {index + 1}
                  </label>
                  <textarea
                    id={`newsText-${index}`}
                    placeholder="Pega o escribe aquí el contenido de la noticia..."
                    style={styles.textarea}
                    value={text}
                    onChange={(e) => handleNewsTextChange(index, e.target.value)}
                    rows={5}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addNewsTextField}
                disabled={resetLoading || retrainLoading || predictLoading}
                style={{
                  ...styles.plusButton,
                  ...(resetLoading || retrainLoading || predictLoading ? styles.buttonDisabled : {}),
                }}
              >
                +
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={resetLoading || retrainLoading || predictLoading}
            style={{
              ...styles.button,
              ...(predictLoading && styles.buttonDisabled),
            }}
          >
            Predecir
          </button>
        </form>
        {predictLoading && <Spinner />}
        {predictError && <p style={styles.error}>Error: {predictError}</p>}
        {predictions.length > 0 && (
          <div style={styles.resultContainer}>
            <h3 style={styles.resultTitle}>Resultados de la Predicción</h3>
            {predictions.map((pred, idx) => (
              <div key={idx} style={styles.resultItem}>
                <p>
                  Predicción: {pred.prediction === 0 ? "FALSA" : "REAL"} — Probabilidad:{" "}
                  {pred.probability}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección de Reentrenamiento */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Reentrenar Modelo</h2>
        <form onSubmit={handleRetrain} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="csvFile" style={styles.label}>
              Subir CSV
            </label>
            <input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={(e) => setCsvFile(e.target.files[0])}
              style={styles.fileInput}
            />
          </div>
          <button
            type="submit"
            disabled={resetLoading || retrainLoading || predictLoading}
            style={{
              ...styles.button,
              ...(retrainLoading && styles.buttonDisabled),
            }}
          >
            Reentrenar
          </button>
        </form>
        {retrainLoading && <Spinner />}
        {retrainError && <p style={styles.error}>Error: {retrainError}</p>}
        {retrainResult && (
          <div style={styles.resultContainer}>
            <h3 style={styles.resultTitle}>Métricas de Reentrenamiento</h3>
            <p>Precisión: {retrainResult.precision}</p>
            <p>Recall: {retrainResult.recall}</p>
            <p>Puntuación F1: {retrainResult.f1_score}</p>
          </div>
        )}
      </section>

      {/* Sección de Reinicio */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Reiniciar Modelo</h2>
        <button
          onClick={handleReset}
          disabled={resetLoading || retrainLoading || predictLoading}
          style={{
            ...styles.button,
            ...(resetLoading && styles.buttonDisabled),
          }}
        >
          Reiniciar
        </button>
        {resetLoading && <Spinner />}
        {resetError && <p style={styles.error}>Error: {resetError}</p>}
        {resetMessage && <p style={styles.success}>{resetMessage}</p>}
      </section>
    </div>
  );
}

// Estilos mejorados (producción, con soporte para múltiples entradas, loaders, switch y botón plus)
const styles = {
  container: {
    fontFamily: "'Roboto', sans-serif",
    maxWidth: "1000px",
    margin: "60px auto",
    padding: "50px",
    background: "linear-gradient(135deg, #ffffff, #e9ecef)",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
  },
  title: {
    textAlign: "center",
    color: "#212529",
    marginBottom: "40px",
    fontSize: "3rem",
    letterSpacing: "1px",
  },
  section: {
    marginBottom: "60px",
    paddingBottom: "40px",
    borderBottom: "1px solid #ced4da",
  },
  sectionTitle: {
    color: "#343a40",
    marginBottom: "25px",
    fontSize: "2rem",
    textShadow: "1px 1px 3px rgba(0,0,0,0.1)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "15px",
  },
  label: {
    fontWeight: "600",
    color: "#495057",
    fontSize: "1.15rem",
    marginBottom: "8px",
  },
  textarea: {
    resize: "vertical",
    padding: "16px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid #adb5bd",
    outline: "none",
    transition: "border 0.3s, box-shadow 0.3s",
  },
  fileInput: {
    marginTop: "8px",
    padding: "8px",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #adb5bd",
  },
  button: {
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    padding: "16px 28px",
    cursor: "pointer",
    fontSize: "1rem",
    borderRadius: "8px",
    width: "220px",
    alignSelf: "flex-start",
    transition: "background-color 0.3s, transform 0.3s",
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
    cursor: "not-allowed",
    opacity: 0.7,
  },
  plusButton: {
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    fontSize: "1.5rem",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background-color 0.3s, transform 0.3s",
    marginBottom: "1rem",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid rgba(0, 0, 0, 0.1)",
    borderTop: "4px solid #007bff",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "10px auto",
  },
  error: {
    color: "#dc3545",
    fontWeight: "600",
    fontSize: "1rem",
  },
  success: {
    color: "#28a745",
    fontWeight: "600",
    fontSize: "1rem",
  },
  resultContainer: {
    marginTop: "30px",
    padding: "30px",
    border: "1px solid #adb5bd",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  resultTitle: {
    marginBottom: "20px",
    color: "#212529",
    fontSize: "1.75rem",
  },
  resultItem: {
    marginBottom: "12px",
  },
  switchContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "30px",
  },
  switchLabel: {
    fontSize: "1.1rem",
    color: "#495057",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  switchInput: {
    width: "20px",
    height: "20px",
  },
};

export default App;
