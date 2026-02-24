import { useEffect, useState } from 'react';
import {
    getResources,
    createResource,
    deleteResource,
} from '../services/resourceService';
import { Link } from 'react-router-dom';
import RoleBased from '../components/RoleBased';

const Resources = () => {
    const [resources, setResources] = useState([]);
    const [filters, setFilters] = useState({
        type: '',
        floorId: '',
        departmentId: '',
        capacity: '',
        features: '',
    });
    const [newResource, setNewResource] = useState({
        name: '',
        type: 'ROOM',
        departmentId: 1,
        floorId: 1,
        capacity: 1,
        features: [],
        deskMode: 'HOT_DESK',
    });

    const fetchResources = async () => {
        const params = {
            type: filters.type || undefined,
            floorId: filters.floorId || undefined,
            departmentId: filters.departmentId || undefined,
            capacity: filters.capacity || undefined,
            features: filters.features
                ? filters.features.split(',').map((f) => f.trim())
                : undefined,
        };

        const res = await getResources(params);
        setResources(res.data);
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleCreate = async () => {
        await createResource({
            ...newResource,
            features: newResource.features.split(','),
        });
        fetchResources();
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
                    type="number"
                    placeholder="Floor ID"
                    className="border p-2"
                    value={filters.floorId}
                    onChange={(e) =>
                        setFilters({ ...filters, floorId: e.target.value })
                    }
                />

                {/* Department */}
                <input
                    type="number"
                    placeholder="Department ID"
                    className="border p-2"
                    value={filters.departmentId}
                    onChange={(e) =>
                        setFilters({ ...filters, departmentId: e.target.value })
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
                {/* Create Resource (Admin Only) */}
                <RoleBased roles={['SYSTEM_ADMIN', 'DEPARTMENT_ADMIN']}>
                    <div className="border p-4 mb-6 rounded bg-gray-50">
                        <h2 className="font-bold mb-4 text-lg">
                            Create Resource
                        </h2>

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
                            <input
                                type="number"
                                placeholder="Department ID"
                                className="border p-2"
                                value={newResource.departmentId}
                                onChange={(e) =>
                                    setNewResource({
                                        ...newResource,
                                        departmentId: Number(e.target.value),
                                    })
                                }
                            />

                            {/* Floor */}
                            <input
                                type="number"
                                placeholder="Floor ID"
                                className="border p-2"
                                value={newResource.floorId}
                                onChange={(e) =>
                                    setNewResource({
                                        ...newResource,
                                        floorId: Number(e.target.value),
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
            </div>
           
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
                            <p>Capacity: {r.capacity}</p>
                            <p>Features: {r.features.join(', ')}</p>
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
