import { useEffect, useState } from 'react';
import {
    getResources,
    createResource,
    deleteResource,
} from '../services/resourceService';
import { getDepartments } from '../services/authService';
import { Link } from 'react-router-dom';
import RoleBased from '../components/RoleBased';

const initialNewResource = {
    name: '',
    type: 'ROOM',
    departmentName: '',
    floorName: '',
    capacity: 1,
    features: '',
    deskMode: 'HOT_DESK',
};

const Resources = () => {
    const [resources, setResources] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [createMessage, setCreateMessage] = useState({ text: '', type: '' });
    const [filters, setFilters] = useState({
        type: '',
        floorName: '',
        departmentName: '',
        capacity: '',
        features: '',
    });
    const [newResource, setNewResource] = useState(initialNewResource);

    const fetchResources = async () => {
        const params = {
            type: filters.type || undefined,
            floorName: filters.floorName || undefined,
            departmentName: filters.departmentName || undefined,
            capacity: filters.capacity || undefined,
            features: filters.features
                ? filters.features.split(',').map((f) => f.trim())
                : undefined,
        };

        const res = await getResources(params);
        setResources(Array.isArray(res?.data) ? res.data : []);
    };

    useEffect(() => {
        fetchResources();

        const fetchDepartments = async () => {
            try {
                const res = await getDepartments();
                setDepartments(Array.isArray(res?.data) ? res.data : []);
            } catch {
                setDepartments([]);
            }
        };

        fetchDepartments();
    }, []);

    const handleCreate = async () => {
        setCreateMessage({ text: '', type: '' });
        try {
            await createResource({
                ...newResource,
                features: newResource.features
                    .split(',')
                    .map((feature) => feature.trim())
                    .filter(Boolean),
            });
            setCreateMessage({
                text: 'Resource created successfully!',
                type: 'success',
            });
            setNewResource(initialNewResource);
            fetchResources();
        } catch (err) {
            setCreateMessage({
                text: err.response?.data?.error || 'Create resource failed',
                type: 'error',
            });
        }
    };

    const handleDelete = async (id) => {
        await deleteResource(id);
        fetchResources();
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Resources</h1>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {/* Type */}
                <select
                    className="border p-2"
                    value={filters.type}
                    onChange={(e) =>
                        setFilters({ ...filters, type: e.target.value })
                    }
                >
                    <option value="">All Types</option>
                    <option value="ROOM">ROOM</option>
                    <option value="DESK">DESK</option>
                    <option value="PARKING">PARKING</option>
                </select>

                {/* Floor */}
                <input
                    type="text"
                    placeholder="Floor Name"
                    className="border p-2"
                    value={filters.floorName}
                    onChange={(e) =>
                        setFilters({ ...filters, floorName: e.target.value })
                    }
                />

                {/* Department */}
                <input
                    type="text"
                    placeholder="Department Name"
                    className="border p-2"
                    value={filters.departmentName}
                    onChange={(e) =>
                        setFilters({
                            ...filters,
                            departmentName: e.target.value,
                        })
                    }
                />

                {/* Capacity */}
                <input
                    type="number"
                    placeholder="Capacity"
                    className="border p-2"
                    value={filters.capacity}
                    onChange={(e) =>
                        setFilters({ ...filters, capacity: e.target.value })
                    }
                />

                {/* Features */}
                <input
                    placeholder="Features (comma separated)"
                    className="border p-2"
                    value={filters.features}
                    onChange={(e) =>
                        setFilters({ ...filters, features: e.target.value })
                    }
                />

                <button
                    onClick={fetchResources}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Search
                </button>
            </div>
            {/* Create Resource (System Admin Only) */}
                <RoleBased roles={['SYSTEM_ADMIN']}>
                    <div className="border p-4 mb-6 rounded bg-gray-50">
                        <h2 className="font-bold mb-4 text-lg">
                            Create Resource
                        </h2>

                        {createMessage.text && (
                            <p
                                className={`mb-3 font-medium ${
                                    createMessage.type === 'success'
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}
                            >
                                {createMessage.text}
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {/* Name */}
                            <input
                                placeholder="Name"
                                className="border p-2"
                                value={newResource.name}
                                onChange={(e) =>
                                    setNewResource({
                                        ...newResource,
                                        name: e.target.value,
                                    })
                                }
                            />

                            {/* Type */}
                            <select
                                className="border p-2"
                                value={newResource.type}
                                onChange={(e) =>
                                    setNewResource({
                                        ...newResource,
                                        type: e.target.value,
                                    })
                                }
                            >
                                <option value="ROOM">ROOM</option>
                                <option value="DESK">DESK</option>
                                <option value="PARKING">PARKING</option>
                            </select>

                            {/* Department */}
                            <select
                                className="border p-2 bg-white"
                                value={newResource.departmentName}
                                onChange={(e) =>
                                    setNewResource({
                                        ...newResource,
                                        departmentName: e.target.value,
                                    })
                                }
                            >
                                <option value="" disabled>
                                    Select Department
                                </option>
                                {departments.map((department) => (
                                    <option key={department} value={department}>
                                        {department}
                                    </option>
                                ))}
                            </select>

                            {/* Floor */}
                            <input
                                type="text"
                                placeholder="Floor Name"
                                className="border p-2"
                                value={newResource.floorName}
                                onChange={(e) =>
                                    setNewResource({
                                        ...newResource,
                                        floorName: e.target.value,
                                    })
                                }
                            />

                            {/* Capacity */}
                            <input
                                type="number"
                                placeholder="Capacity"
                                className="border p-2"
                                value={newResource.capacity}
                                onChange={(e) =>
                                    setNewResource({
                                        ...newResource,
                                        capacity: Number(e.target.value),
                                    })
                                }
                            />

                            {/* Features */}
                            <input
                                placeholder="Features (comma separated)"
                                className="border p-2"
                                value={newResource.features}
                                onChange={(e) =>
                                    setNewResource({
                                        ...newResource,
                                        features: e.target.value,
                                    })
                                }
                            />

                            {/* Desk Mode */}
                            <select
                                className="border p-2"
                                value={newResource.deskMode}
                                onChange={(e) =>
                                    setNewResource({
                                        ...newResource,
                                        deskMode: e.target.value,
                                    })
                                }
                            >
                                <option value="HOT_DESK">HOT_DESK</option>
                                <option value="ASSIGNED">ASSIGNED</option>
                            </select>
                        </div>

                        <button
                            onClick={handleCreate}
                            className="bg-green-600 text-white px-4 py-2 mt-4 rounded w-full"
                        >
                            Create Resource
                        </button>
                    </div>
                </RoleBased>
           
            {/* Resource List */}
            <div className="grid gap-4">
                {resources.map((r) => (
                    <div
                        key={r.id}
                        className="border p-4 flex justify-between items-center"
                    >
                        <div>
                            <Link
                                to={`/resources/${r.id}`}
                                className="font-bold text-blue-600"
                            >
                                {r.name}
                            </Link>
                            <p>Type: {r.type}</p>
                            <p>Department: {r.departmentName}</p>
                            <p>Floor: {r.floorName}</p>
                            <p>Capacity: {r.capacity}</p>
                            <p>
                                Features:{' '}
                                {Array.isArray(r.features)
                                    ? r.features.join(', ')
                                    : ''}
                            </p>
                        </div>

                        <RoleBased roles={['SYSTEM_ADMIN']}>
                            <button
                                onClick={() => handleDelete(r.id)}
                                className="bg-red-500 text-white px-3 py-1"
                            >
                                Delete
                            </button>
                        </RoleBased>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Resources;
