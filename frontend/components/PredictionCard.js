export default function PredictionCard({ prediction }) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>AI Tahmin</h3>

      {[
        ["Ev Sahibi", prediction.homeWin],
        ["Beraberlik", prediction.draw],
        ["Deplasman", prediction.awayWin],
      ].map(([label, value]) => (
        <div key={label} style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
            }}
          >
            <span>{label}</span>
            <span>{value}%</span>
          </div>

          <div className="progress">
            <span style={{ width: `${value}%` }} />
          </div>
        </div>
      ))}

      <div className="small">Güven oranı: %{prediction.confidence}</div>
    </div>
  );
}
