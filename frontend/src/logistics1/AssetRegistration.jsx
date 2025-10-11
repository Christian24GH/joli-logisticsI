import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { logisticsI } from '../api/logisticsI';

const AssetRegistration = () => {
  // State for equipment and projects
  const [equipment, setEquipment] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assets, setAssets] = useState([]);

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    equipment_id: '',
    asset_code: '',
    assigned_project_id: '',
    description: ''
  });
  const [qrCode, setQrCode] = useState(null);

  // Scan state
  const [scanToken, setScanToken] = useState('');
  const [scannedAsset, setScannedAsset] = useState(null);

  // Link state
  const [linkForm, setLinkForm] = useState({
    asset_id: '',
    project_id: ''
  });

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch equipment, projects, and assets on mount
  useEffect(() => {
    fetchEquipment();
    fetchProjects();
    fetchAssets();
  }, []);

  const fetchEquipment = async () => {
    try {
      const response = await axios.get(logisticsI.backend.api.equipment);
      setEquipment(response.data);
    } catch (err) {
      setError('Failed to fetch equipment');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(logisticsI.backend.api.projects);
      setProjects(response.data);
    } catch (err) {
      setError('Failed to fetch projects');
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await axios.get(logisticsI.backend.api.assets);
      setAssets(response.data);
    } catch (err) {
      setError('Failed to fetch assets');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(logisticsI.backend.api.assetAdd, registerForm);
      setQrCode(response.data.qr_code_url);
      fetchAssets(); // Refresh assets
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  const handleScan = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(logisticsI.backend.api.qrAssetShow.replace('{token}', scanToken));
      setScannedAsset(response.data);
    } catch (err) {
      setError('Asset not found');
    }
    setLoading(false);
  };

  const handleLink = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.put(logisticsI.backend.api.assetUpdate.replace('{id}', linkForm.asset_id), { assigned_project_id: linkForm.project_id });
      alert('Asset linked to project successfully');
      fetchAssets(); // Refresh
    } catch (err) {
      setError('Linking failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-center">Asset Registration & QR Tagging</h1>
      {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

      {/* Register Asset */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Generate QR for Equipment</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <select
            value={registerForm.equipment_id}
            onChange={(e) => setRegisterForm({ ...registerForm, equipment_id: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select Equipment</option>
            {Array.isArray(equipment) ? equipment.map(eq => (
              <option key={eq.equipment_id} value={eq.equipment_id}>{eq.name}</option>
            )) : null}
          </select>
          <input
            type="text"
            placeholder="Asset Code"
            value={registerForm.asset_code}
            onChange={(e) => setRegisterForm({ ...registerForm, asset_code: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <select
            value={registerForm.assigned_project_id}
            onChange={(e) => setRegisterForm({ ...registerForm, assigned_project_id: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select Project (Optional)</option>
            {projects.map(proj => (
              <option key={proj.project_id} value={proj.project_id}>{proj.name}</option>
            ))}
          </select>
          <textarea
            placeholder="Description"
            value={registerForm.description}
            onChange={(e) => setRegisterForm({ ...registerForm, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 resize-none"
            rows={3}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Register Asset
          </button>
        </form>
        {qrCode && <img src={qrCode} alt="QR Code" className="mt-4 mx-auto" />}
      </section>

      {/* Scan QR */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Scan to Retrieve Details</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter QR Token"
            value={scanToken}
            onChange={(e) => setScanToken(e.target.value)}
            className="flex-grow border border-gray-300 rounded px-3 py-2"
          />
          <button
            onClick={handleScan}
            disabled={loading}
            className="bg-green-600 text-white px-4 rounded hover:bg-green-700 disabled:opacity-50"
          >
            Scan
          </button>
        </div>
        {scannedAsset && (
          <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-50">
            <p><strong>Asset Code:</strong> {scannedAsset.asset_code}</p>
            <p><strong>Description:</strong> {scannedAsset.description}</p>
            {/* Add more fields */}
          </div>
        )}
      </section>

      {/* Link to Project */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Link to Tour or Project</h2>
        <div className="flex space-x-2 mb-4">
          <select
            value={linkForm.asset_id}
            onChange={(e) => setLinkForm({ ...linkForm, asset_id: e.target.value })}
            className="flex-grow border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select Asset</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>{asset.asset_code}</option>
            ))}
          </select>
          <select
            value={linkForm.project_id}
            onChange={(e) => setLinkForm({ ...linkForm, project_id: e.target.value })}
            className="flex-grow border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Select Project</option>
            {projects.map(proj => (
              <option key={proj.project_id} value={proj.project_id}>{proj.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleLink}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Link
        </button>
      </section>
    </div>
  );
};

export default AssetRegistration;
