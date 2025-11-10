import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import MapHeader from '../components/MapComponents/MapHeader';
import BonusCard from '../components/ListComponents/BonusCard';
import '../styles/List.css';

/*
  Bonuses Page
  - Aggregates ALL bonuses from Business Pro centers
  - Sorting: newest bonus first
  - Filters: search by center name or bonus title
*/
export default function Bonuses() {
  const [centers, setCenters] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await axios.get(`${API_BASE}/api/centers`);
        setCenters(res.data || []);
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  // Filter Business Pro centers with bonus
  const bonusCenters = useMemo(() => {
    return centers.filter(c => {
      const ownerPlan = c?.owner?.subscription?.plan || c?.subscription?.plan || '';
      const normalized = ownerPlan.toLowerCase().replace(/[-_\s]+/g,'_');
      return Array.isArray(c.bonus) && c.bonus.length && normalized === 'business_pro';
    });
  }, [centers]);

  // Flatten bonuses with reference to center for sorting
  const flattened = useMemo(() => {
    const list = [];
    bonusCenters.forEach(center => {
      (center.bonus || []).forEach(b => {
        list.push({ center, bonus: b });
      });
    });
    // newest bonus first
    return list.sort((a,b) => new Date(b.bonus.createdAt) - new Date(a.bonus.createdAt));
  }, [bonusCenters]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flattened;
    return flattened.filter(item => {
      return (item.center.name || '').toLowerCase().includes(q) || (item.bonus.title || '').toLowerCase().includes(q);
    });
  }, [flattened, query]);

  return (
    <div className="page-with-bottom-space">
      <MapHeader />
      <div className="list-page-container">
        <div className="list-section-header" style={{marginBottom:16}}>
          <h3>All Bonuses</h3>
          <input
            type="text"
            placeholder="Хайх..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{padding:'8px 14px', border:'2px solid #e5e7eb', borderRadius:12, fontSize:13, fontWeight:600}}
          />
        </div>
        {loading && <div>Loading...</div>}
        {error && <div style={{color:'red'}}>{error}</div>}
        {!loading && !error && filtered.length === 0 && (
          <div style={{textAlign:'center', padding:'40px 0', color:'#666'}}>Бонус олдсонгүй</div>
        )}
        <div style={{display:'grid', gap:20, gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))'}}>
          {filtered.map(({ center }, idx) => (
            <BonusCard key={center._id + '-' + idx} center={center} onOrder={() => {}} onClick={() => { window.location.href = `/center/${center._id}`; }} />
          ))}
        </div>
      </div>
    </div>
  );
}
