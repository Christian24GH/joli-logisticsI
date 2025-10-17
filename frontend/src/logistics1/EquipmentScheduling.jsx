import React, { useState, useEffect } from 'react';

const EquipmentScheduling = () => {
    // State for equipment schedules
    const [schedules, setSchedules] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for forms
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [showDateTimeForm, setShowDateTimeForm] = useState(false);
    const [showApproveForm, setShowApproveForm] = useState(false);

    // Form data
    const [assignForm, setAssignForm] = useState({
        equipment_id: '',
        project_id: '',
        quantity: 1,
        assigned_by: 'current_user', // This should be dynamic based on logged in user
        status: 'Pending',
        start_date: '',
        end_date: ''
    });

    const [dateTimeForm, setDateTimeForm] = useState({
        schedule_id: '',
        start_date: '',
        end_date: ''
    });

    const [approveForm, setApproveForm] = useState({
        schedule_id: ''
    });

    // Fetch data on component mount
    useEffect(() => {
        fetchSchedules();
        fetchEquipment();
        fetchProjects();
    }, []);

    // Fetch equipment schedules
    const fetchSchedules = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/equipment-schedule', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Schedules data:', data);
            setSchedules(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching schedules:', err);
            setError('Failed to fetch equipment schedules');
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch equipment
    const fetchEquipment = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/equipment', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw equipment API response:', data);
            console.log('Equipment data type:', typeof data);
            console.log('Equipment is array:', Array.isArray(data));

            // Handle different possible response formats
            let equipmentArray = [];
            if (Array.isArray(data)) {
                equipmentArray = data;
            } else if (data && data.data && Array.isArray(data.data)) {
                equipmentArray = data.data;
            } else if (data && typeof data === 'object') {
                // If it's an object with equipment data
                equipmentArray = Object.values(data).filter(item => item && typeof item === 'object' && item.name);
            }

            console.log('Processed equipment array:', equipmentArray);
            console.log('Equipment count:', equipmentArray.length);

            setEquipment(equipmentArray);

            // Show available equipment in console for debugging
            const availableEquipment = equipmentArray.filter(item => {
                const stock = item.stock_quantity || 0;
                return item.status === 'active' && stock >= 0;
            });
            console.log('Available equipment for dropdown:', availableEquipment);

        } catch (err) {
            console.error('Error fetching equipment:', err);
            setEquipment([]);
        }
    };

    // Fetch projects
    const fetchProjects = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/projects', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw projects API response:', data);
            console.log('Projects data type:', typeof data);

            // Handle different possible response formats
            let projectsArray = [];
            if (Array.isArray(data)) {
                projectsArray = data;
            } else if (data && data.data && Array.isArray(data.data)) {
                projectsArray = data.data;
            } else if (data && typeof data === 'object') {
                // If it's an object with project data
                projectsArray = Object.values(data).filter(item => item && typeof item === 'object' && (item.name || item.project_name));
            }

            console.log('Processed projects array:', projectsArray);
            console.log('Projects count:', projectsArray.length);

            setProjects(projectsArray);

        } catch (err) {
            console.error('Error fetching projects:', err);
            setProjects([]);
        }
    };

    // Assign equipment to tour
    const handleAssignEquipment = async (e) => {
        e.preventDefault();
        try {
            console.log('Sending assignment data:', assignForm);

            const response = await fetch('http://localhost:8000/api/assign-equipment-to-tour', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    equipment_id: assignForm.equipment_id,
                    project_id: assignForm.project_id,
                    quantity: assignForm.quantity,
                    start_date: assignForm.start_date,
                    end_date: assignForm.end_date,
                    assigned_by: assignForm.assigned_by,
                    status: assignForm.status
                })
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const newSchedule = await response.json();
            console.log('Assignment successful:', newSchedule);

            setSchedules([...schedules, newSchedule]);
            setShowAssignForm(false);
            setAssignForm({
                equipment_id: '',
                project_id: '',
                quantity: 1,
                assigned_by: 'current_user',
                status: 'Pending',
                start_date: '',
                end_date: ''
            });
            alert('Equipment assigned to tour successfully!');
        } catch (err) {
            console.error('Error assigning equipment:', err);
            alert(`Failed to assign equipment to tour: ${err.message}`);
        }
    };

    // Set date and time for schedule
    const handleSetDateTime = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8000/api/equipment-schedules/${dateTimeForm.schedule_id}/set-date-time`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    scheduled_date: dateTimeForm.scheduled_date,
                    scheduled_time: dateTimeForm.scheduled_time
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchSchedules(); // Refresh schedules
            setShowDateTimeForm(false);
            setDateTimeForm({
                schedule_id: '',
                start_date: '',
                end_date: ''
            });
            alert('Date and time updated successfully!');
        } catch (err) {
            console.error('Error updating date and time:', err);
            alert('Failed to update date and time');
        }
    };

    // Approve schedule
    const handleApproveSchedule = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8000/api/equipment-schedules/${approveForm.schedule_id}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchSchedules(); // Refresh schedules
            setShowApproveForm(false);
            setApproveForm({
                schedule_id: ''
            });
            alert('Schedule approved successfully!');
        } catch (err) {
            console.error('Error approving schedule:', err);
            alert('Failed to approve schedule');
        }
    };

    // Update schedule
    const handleUpdateSchedule = async (scheduleId, updatedData) => {
        try {
            const response = await fetch(`http://localhost:8000/api/equipment-schedule/${scheduleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            await fetchSchedules(); // Refresh schedules
            alert('Schedule updated successfully!');
        } catch (err) {
            console.error('Error updating schedule:', err);
            alert('Failed to update schedule');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipment Scheduling</h1>
                <p className="text-gray-600">Manage equipment assignments, schedules, and approvals</p>
            </div>

            {/* Action Buttons */}
            <div className="mb-6 flex flex-wrap gap-4">
                <button
                    onClick={() => setShowAssignForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                    Assign Equipment to Tour
                </button>
                <button
                    onClick={() => setShowDateTimeForm(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                >
                    Set Date & Time
                </button>
                <button
                    onClick={() => setShowApproveForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
                >
                    Approve Schedule
                </button>
            </div>

            {/* Assign Equipment Form */}
            {showAssignForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Equipment to Tour</h3>
                            <form onSubmit={handleAssignEquipment}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Equipment
                                    </label>
                                    <select
                                        value={assignForm.equipment_id}
                                        onChange={(e) => setAssignForm({...assignForm, equipment_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Equipment</option>
                                        {equipment.length === 0 ? (
                                            <option value="" disabled>No equipment available</option>
                                        ) : (
                                            <>
                                                {/* Show active equipment with stock */}
                                                {equipment.filter(item => {
                                                    const stock = item.stock_quantity || 0;
                                                    return (item.status === 'active' || !item.status) && stock > 0;
                                                }).map((item) => (
                                                    <option key={item.equipment_id} value={item.equipment_id}>
                                                        {item.name} (Stock: {item.stock_quantity || 0})
                                                    </option>
                                                ))}
                                                {/* Show active equipment without stock check */}
                                                {equipment.filter(item => {
                                                    return (item.status === 'active' || !item.status) && (!item.stock_quantity || item.stock_quantity === 0);
                                                }).map((item) => (
                                                    <option key={item.equipment_id} value={item.equipment_id}>
                                                        {item.name} (Stock: {item.stock_quantity || 0})
                                                    </option>
                                                ))}
                                                {/* Fallback: show all equipment if no active equipment found */}
                                                {equipment.filter(item => item.status !== 'active').length === equipment.length && equipment.length > 0 && (
                                                    equipment.map((item) => (
                                                        <option key={item.equipment_id} value={item.equipment_id}>
                                                            {item.name} (Stock: {item.stock_quantity || 0}) - {item.status || 'No Status'}
                                                        </option>
                                                    ))
                                                )}
                                            </>
                                        )}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Project/Tour
                                    </label>
                                    <select
                                        value={assignForm.project_id}
                                        onChange={(e) => setAssignForm({...assignForm, project_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Project</option>
                                        {projects.map((project) => (
                                            <option key={project.project_id || project.id} value={project.project_id || project.id}>
                                                {project.name || project.project_name || 'Unnamed Project'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={assignForm.quantity}
                                        onChange={(e) => setAssignForm({...assignForm, quantity: parseInt(e.target.value) || 1})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={assignForm.start_date}
                                        onChange={(e) => setAssignForm({...assignForm, start_date: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={assignForm.end_date}
                                        onChange={(e) => setAssignForm({...assignForm, end_date: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAssignForm(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Assign Equipment
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Set Date & Time Form */}
            {showDateTimeForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Set Date & Time of Use</h3>
                            <form onSubmit={handleSetDateTime}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Schedule
                                    </label>
                                    <select
                                        value={dateTimeForm.schedule_id}
                                        onChange={(e) => setDateTimeForm({...dateTimeForm, schedule_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    >
                                        <option value="">Select Schedule</option>
                                        {schedules.map((schedule) => (
                                            <option key={schedule.schedule_id} value={schedule.schedule_id}>
                                                Schedule #{schedule.schedule_id} - Equipment: {equipment.find(eq => eq.equipment_id === schedule.equipment_id)?.name || 'Unknown Equipment'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateTimeForm.start_date}
                                        onChange={(e) => setDateTimeForm({...dateTimeForm, start_date: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateTimeForm.end_date}
                                        onChange={(e) => setDateTimeForm({...dateTimeForm, end_date: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowDateTimeForm(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                    >
                                        Update Date & Time
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Schedule Form */}
            {showApproveForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Approve Schedule</h3>
                            <form onSubmit={handleApproveSchedule}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Schedule to Approve
                                    </label>
                                    <select
                                        value={approveForm.schedule_id}
                                        onChange={(e) => setApproveForm({...approveForm, schedule_id: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        required
                                    >
                                        <option value="">Select Schedule</option>
                                        {schedules.filter(schedule => !schedule.approved).map((schedule) => (
                                            <option key={schedule.schedule_id} value={schedule.schedule_id}>
                                                Schedule #{schedule.schedule_id} - {new Date(schedule.scheduled_date).toLocaleDateString()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowApproveForm(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                    >
                                        Approve Schedule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedules Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Equipment Schedules</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Schedule ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Equipment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Project
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Scheduled Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {schedules.map((schedule) => (
                                <tr key={schedule.schedule_id || schedule.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        #{schedule.schedule_id || schedule.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {equipment.find(eq => eq.equipment_id === schedule.equipment_id)?.name || 'Unknown Equipment'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {projects.find(p => p.project_id === schedule.project_id)?.name || 'Unknown Project'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {schedule.scheduled_date ? new Date(schedule.scheduled_date).toLocaleDateString() : 'No Date'} at {schedule.scheduled_time || 'No Time'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            schedule.approved
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {schedule.approved ? 'Approved' : 'Pending'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setDateTimeForm({
                                                        schedule_id: schedule.schedule_id || schedule.id,
                                                        scheduled_date: schedule.scheduled_date || '',
                                                        scheduled_time: schedule.scheduled_time || ''
                                                    });
                                                    setShowDateTimeForm(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Edit Date/Time
                                            </button>
                                            {!schedule.approved && (
                                                <button
                                                    onClick={() => {
                                                        setApproveForm({ schedule_id: schedule.schedule_id || schedule.id });
                                                        setShowApproveForm(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {schedules.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No equipment schedules found</p>
                    <p className="text-gray-400 mt-2">Create your first schedule by clicking "Assign Equipment to Tour"</p>
                </div>
            )}
        </div>
    );
};

export default EquipmentScheduling;
