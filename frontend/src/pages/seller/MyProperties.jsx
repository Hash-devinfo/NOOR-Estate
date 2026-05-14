import { Link } from "react-router-dom";
import { myPropertiesStyles as s } from "../../assets/dummyStyles";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import axios from "axios";
import API_URL from "../../config";
import { HiOutlineCheckCircle, HiOutlineLibrary, HiOutlinePencilAlt, HiOutlineTrash } from "react-icons/hi";
import PropertyCard from "../../components/common/PropertyCard";

const MyProperties = () => {
  // FIX: all three states given proper initial values
  const [properties, setProperties] = useState([]); // was useState() → undefined
  const [loading, setLoading] = useState(true); // was useState() → undefined, loader never showed
  const [error, setError] = useState(null); // was useState() → undefined

  const { token } = useAuth();

  // Fetch properties from the server
  const fetchMyProperties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/property/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const props = Array.isArray(res.data)
        ? res.data
        : res.data.properties || [];
      setProperties(props);
      setLoading(false); // FIX: was missing from happy path — loader spun forever on success
    } catch (err) {
      setError("Failed to load your properties", err); // FIX: setError only takes one argument
      setLoading(false);
    }
  };

  // FIX: added token to dependency array so data re-fetches if token changes
  useEffect(() => {
    fetchMyProperties();
  }, [token]);

  // Delete a property
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;
    try {
      await axios.delete(`${API_URL}/api/property/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties(properties.filter((p) => p._id !== id));
    } catch (err) {
      alert("Failed to delete property");
      console.error(err);
    }
  };

  // Update property status
  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(
        `${API_URL}/api/property/${id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }, // FIX: was "header" (missing 's') → 401 on every request
        },
      );
      setProperties(
        properties.map((p) => (p._id === id ? { ...p, status: newStatus } : p)),
      );
    } catch (err) {
      alert("Failed to update status"); // FIX: was "ststus"
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className={s.loaderFullPage}>
        <div className={s.loader}></div>
      </div>
    );

  if (error)
    return (
      <div className={s.loaderFullPage}>
        <p>{error}</p>
      </div>
    );

  return (
    <div className={s.fadeIn}>
      <div className={s.header}>
        <div>
          <h1 className={s.heading}>My Listings</h1>
          <p className={s.subheading}>
            Manage your listed properties and their status.
          </p>
        </div>
        <Link to="/add-property" className={s.addButton}>
          Add New Listing
        </Link>
      </div>

      <div>
        {!Array.isArray(properties) || properties.length === 0 ? (
          <div className={s.emptyCard}>
            <div className={s.emptyIconWrapper}>
              <HiOutlineLibrary size={40} color="#394a3b" />{" "}
              {/* FIX: was "394a3b8" — invalid hex, missing # */}
            </div>
            <h2 className={s.emptyTitle}>No properties found</h2>
            <p className={s.emptyText}>
              Start your journey by adding your first property listing.{" "}
              {/* FIX: was "Select ypur journey" */}
            </p>
            <Link to="/add-property" className={s.emptyButton}>
              Add Your First Listing
            </Link>
          </div>
        ) : (
          <div className={s.grid}>
            {properties.map(
              (
                p, // FIX: was { } with no return — grid was completely blank
              ) => (
                <PropertyCard
                  key={p._id}
                  property={p}
                  renderActions={() => (
                    // FIX: was () => { } with no return — actions never rendered
                    <div className={s.actionContainer}>
                      <div className={s.selectWrapper}>
                        <select
                          value={p.status === "sale" ? "available" : p.status} // FIX: "avaliable" → "available"
                          onChange={(e) => {
                            const val = e.target.value;
                            // FIX: removed pointless getAvailableStatus() wrapper, inline value directly
                            updateStatus(
                              p._id,
                              val === "available" ? "sale" : val,
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className={`${s.select} ${
                            p.status === "sold"
                              ? s.selectSold
                              : s.selectAvailable
                          }`}
                        >
                          <option value="available">Available</option>{" "}
                          <option value="sold">Sold</option>
                        </select>
                        <div className={s.selectIcon}>
                            <HiOutlineCheckCircle size={14}/>
                        </div>
                      </div>
                      <Link to={`/edit-property/${p._id}`}
                       className={s.editButton}>
                        <HiOutlinePencilAlt/> Edit
                       </Link>
                       <button onClick={(e)=>{
                        e.stopPropagation()
                        handleDelete(p._id)
                       }} className={s.deleteButton}>
                        <HiOutlineTrash/>
                       </button>
                    </div>
                  )}
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProperties;
