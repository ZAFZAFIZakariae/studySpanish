import './styles/global.css';

const container = document.getElementById('root');

if (container) {
  container.innerHTML = `
    <main class="app-placeholder">
      <h1>Study Compass Preview</h1>
      <p>
        This project now uses <code>preview.html</code> for exploring subject extracts without
        running the full React application.
      </p>
      <ol>
        <li>Run <code>npm run preview</code>.</li>
        <li>Open <a href="/" rel="noopener">http://localhost:5173/</a> in your browser.</li>
        <li>Use the dropdown to choose an extract and read its contents.</li>
      </ol>
      <p>
        The React-based shell remains in the repository for reference, but it is no longer
        required to view extracted markdown files.
      </p>
    </main>
  `;
}
