import React, { useState, useEffect } from "react";
import "./styles/ManageCounter.css";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_COUNTER,
  UPDATE_COUNTER,
  DELETE_COUNTER,
} from "../../graphql/mutation";
import { GET_COUNTERS, GET_DEPARTMENTS } from "../../graphql/query";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaDesktop,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { HiOfficeBuilding } from "react-icons/hi";
import Swal from "sweetalert2";

const ManageCounter = ({
  counters: propCounters,
  setCounters: propSetCounters,
}) => {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [editingCounter, setEditingCounter] = useState(null);
  const [newCounter, setNewCounter] = useState({
    name: "",
    departmentId: "",
  });
  const [deletingCounterId, setDeletingCounterId] = useState(null);
  const [updatingCounterId, setUpdatingCounterId] = useState(null);
  const [collapsedDepartments, setCollapsedDepartments] = useState(new Set());

  const isUsingProps =
    propCounters !== undefined && propSetCounters !== undefined;

  const [localCounters, setLocalCounters] = useState([]);

  const counters = isUsingProps ? propCounters : localCounters;
  const setCounters = isUsingProps ? propSetCounters : setLocalCounters;

  const { data, loading, error, refetch } = useQuery(GET_COUNTERS, {
    errorPolicy: "all",
    fetchPolicy: "network-first",
  });

  const { data: departmentsData } = useQuery(GET_DEPARTMENTS, {
    errorPolicy: "all",
    fetchPolicy: "network-first",
  });

  console.log(
    "Counter Query - Loading:",
    loading,
    "Error:",
    error,
    "Data:",
    data,
  );

  const [updateCounter, { loading: updating }] = useMutation(UPDATE_COUNTER, {
    refetchQueries: [{ query: GET_COUNTERS }],
    optimisticResponse: {
      __typename: "Mutation",
      updateCounter: {
        __typename: "Counter",
        counterId: editingCounter?.counterId,
        counterName: newCounter.name,
        department: {
          __typename: "Department",
          departmentId: parseInt(newCounter.departmentId),
          departmentName:
            departmentsData?.departments?.find(
              (d) => d.departmentId === parseInt(newCounter.departmentId),
            )?.departmentName || "",
          prefix:
            departmentsData?.departments?.find(
              (d) => d.departmentId === parseInt(newCounter.departmentId),
            )?.prefix || "",
        },
      },
    },
    onCompleted: (data) => {
      const updatedCounter = data?.updateCounter;
      if (updatedCounter) {
        setCounters((prevCounters) =>
          prevCounters.map((counter) =>
            counter.counterId === editingCounter.counterId
              ? { ...updatedCounter, counterId: editingCounter.counterId }
              : counter,
          ),
        );
      }
      setUpdatingCounterId(null);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Counter updated successfully.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Update counter error:", error);
      setUpdatingCounterId(null);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update counter!",
      });
    },
  });

  const [deleteCounter, { loading: deleting }] = useMutation(DELETE_COUNTER, {
    refetchQueries: [{ query: GET_COUNTERS }],
    optimisticResponse: {
      __typename: "Mutation",
      deleteCounter: {
        __typename: "Counter",
        counterId: null,
      },
    },
    onCompleted: (data) => {
      const deletedCounter = data?.deleteCounter;
      if (deletedCounter) {
        setCounters((prevCounters) =>
          prevCounters.filter(
            (counter) => counter.counterId !== deletedCounter.counterId,
          ),
        );
      }
      setDeletingCounterId(null);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The counter has been successfully deleted.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Delete counter error:", error);
      setDeletingCounterId(null);
      const errorMessage =
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        "Failed to delete counter!";
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: errorMessage,
        confirmButtonColor: "#3085d6",
      });
    },
  });

  const [createCounter, { loading: creating }] = useMutation(CREATE_COUNTER, {
    refetchQueries: [{ query: GET_COUNTERS }],
    optimisticResponse: {
      __typename: "Mutation",
      createCounter: {
        __typename: "Counter",
        counterId: `temp-${Date.now()}`,
        counterName: newCounter.name,
        department: {
          __typename: "Department",
          departmentId: parseInt(newCounter.departmentId),
          departmentName:
            departmentsData?.departments?.find(
              (d) => d.departmentId === parseInt(newCounter.departmentId),
            )?.departmentName || "",
          prefix:
            departmentsData?.departments?.find(
              (d) => d.departmentId === parseInt(newCounter.departmentId),
            )?.prefix || "",
        },
      },
    },
    onCompleted: (data) => {
      const createdCounter = data?.createCounter;
      if (createdCounter) {
        setCounters((prevCounters) => [...prevCounters, createdCounter]);
      }
      Swal.fire({
        icon: "success",
        title: "Created!",
        text: "New counter has been created.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Create counter error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to create counter!",
      });
    },
  });

  useEffect(() => {
    if (Array.isArray(data?.counters)) {
      console.log("Setting counters data:", data.counters);
      setCounters(data.counters);
    }
  }, [data, setCounters]);

  const groupedCounters = counters.reduce((acc, counter) => {
    const deptId = counter.department?.departmentId || "unassigned";
    const deptName =
      counter.department?.departmentName || "Unassigned Department";

    if (!acc[deptId]) {
      acc[deptId] = {
        departmentId: deptId,
        departmentName: deptName,
        prefix: counter.department?.prefix || "",
        counters: [],
      };
    }
    acc[deptId].counters.push(counter);
    return acc;
  }, {});

  const departmentGroups = Object.values(groupedCounters).sort((a, b) => {
    if (a.departmentId === "unassigned") return 1;
    if (b.departmentId === "unassigned") return -1;
    return a.departmentName.localeCompare(b.departmentName);
  });

  const toggleDepartment = (deptId) => {
    setCollapsedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  const handleAddCounter = async (e) => {
    e.preventDefault();

    if (editingCounter) {
      setUpdatingCounterId(editingCounter.counterId);
      try {
        await updateCounter({
          variables: {
            updateCounterInput: {
              counterId: editingCounter.counterId,
              counterName: newCounter.name,
              departmentId: parseInt(newCounter.departmentId),
            },
          },
        });
      } catch (error) {
        console.error("Update error:", error);
        setUpdatingCounterId(null);
      }
      setEditingCounter(null);
    } else {
      try {
        await createCounter({
          variables: {
            createCounterInput: {
              counterName: newCounter.name,
              departmentId: parseInt(newCounter.departmentId),
            },
          },
        });
      } catch (error) {
        console.error("Create error:", error);
      }
    }

    setNewCounter({ name: "", departmentId: "" });
    setShowCounterForm(false);
  };

  const handleEditCounter = (counter) => {
    setEditingCounter(counter);
    setNewCounter({
      name: counter.counterName,
      departmentId: counter.department?.departmentId?.toString() || "",
    });
    setShowCounterForm(true);
  };

  const handleDeleteCounter = async (counterId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This counter will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setDeletingCounterId(counterId);
      try {
        await deleteCounter({
          variables: { removeCounterId: parseInt(counterId) },
          optimisticResponse: {
            __typename: "Mutation",
            deleteCounter: {
              __typename: "Counter",
              counterId: counterId,
            },
          },
        });
      } catch (error) {
        console.error("Delete error:", error);
        setDeletingCounterId(null);

        refetch();
      }
    }
  };

  const handleCancelForm = () => {
    setShowCounterForm(false);
    setEditingCounter(null);
    setNewCounter({ name: "", departmentId: "" });
  };

  if (loading) {
    console.log("Showing loading state...");
    return (
      <div className="counters-content">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading counter data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("Showing error state:", error);
    return (
      <div className="counters-content">
        <div className="error-message">
          Error loading counter data: {error.message}
        </div>
      </div>
    );
  }

  console.log("Rendering counter table with data:", counters);

  return (
    <div className="counters-content">
      <div className="counters-table-container">
        <div className="table-header">
          <div className="table-title">
            <h3>All Counters</h3>
            <span className="counter-count">{counters.length} Total</span>
          </div>
        </div>

        <div className="counters-grouped">
          {departmentGroups.length > 0
            ? departmentGroups.map((group) => (
                <div key={group.departmentId} className="department-group">
                  <div
                    className="department-header"
                    onClick={() => toggleDepartment(group.departmentId)}
                  >
                    <div className="department-info">
                      <div className="department-avatar">
                        <HiOfficeBuilding className="department-icon" />
                      </div>
                      <div className="department-details">
                        <h3 className="department-name">
                          {group.departmentName}
                          {group.prefix && (
                            <span className="department-prefix-badge">
                              ({group.prefix})
                            </span>
                          )}
                        </h3>
                        <span className="counter-badge">
                          {group.counters.length}{" "}
                          {group.counters.length === 1 ? "Counter" : "Counters"}
                        </span>
                      </div>
                    </div>
                    <button className="collapse-btn">
                      {collapsedDepartments.has(group.departmentId) ? (
                        <FaChevronDown />
                      ) : (
                        <FaChevronUp />
                      )}
                    </button>
                  </div>

                  {!collapsedDepartments.has(group.departmentId) && (
                    <div className="counters-list">
                      {group.counters.map((counter) => {
                        const isDeleting =
                          deletingCounterId === counter.counterId;
                        const isUpdating =
                          updatingCounterId === counter.counterId;
                        const isProcessing = isDeleting || isUpdating;

                        return (
                          <div
                            key={counter.counterId}
                            className={`counter-card ${isProcessing ? "processing-counter" : ""}`}
                          >
                            <div className="counter-info">
                              <div className="counter-icon">
                                <FaDesktop />
                              </div>
                              <div className="counter-details">
                                <span className="counter-name">
                                  {counter.counterName}
                                  {isProcessing && (
                                    <span className="processing-indicator">
                                      <div className="spinner-small"></div>
                                      {isDeleting
                                        ? "Deleting..."
                                        : "Updating..."}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                            <div className="counter-actions">
                              <button
                                onClick={() => handleEditCounter(counter)}
                                className="edit-btn"
                                title="Edit Counter"
                                disabled={isProcessing || deleting || updating}
                              >
                                <FaEdit className="btn-icon" />
                                {isUpdating ? "Editing..." : "Edit"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            : !loading && (
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <FaDesktop className="empty-icon" />
                  </div>
                  <h3>No Counters Yet</h3>
                  <p>Start organizing your counters by creating new ones</p>
                  <button
                    onClick={() => setShowCounterForm(true)}
                    className="empty-state-btn"
                    disabled={creating}
                  >
                    <FaPlus className="btn-icon" />
                    Create First Counter
                  </button>
                </div>
              )}
        </div>

        <button
          onClick={() => setShowCounterForm(true)}
          className="add-counter-floating-btn"
          title="Add Counter"
          disabled={creating || updating || deleting}
        >
          <FaPlus className="btn-icon" />
        </button>
      </div>

      {showCounterForm && (
        <div className="counter-form-overlay">
          <div className="counter-form-modal">
            <div className="modal-header">
              <h3>{editingCounter ? "Edit Counter" : "Add New Counter"}</h3>
              <button
                onClick={handleCancelForm}
                className="close-modal-btn"
                disabled={creating || updating}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddCounter}>
              <div className="form-group">
                <label>Counter Name</label>
                <input
                  type="text"
                  placeholder="Enter Counter Name (e.g. Counter 1)"
                  value={newCounter.name}
                  onChange={(e) => {
                    setNewCounter({
                      ...newCounter,
                      name: e.target.value,
                    });
                  }}
                  required
                  disabled={creating || updating}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={newCounter.departmentId}
                  onChange={(e) => {
                    setNewCounter({
                      ...newCounter,
                      departmentId: e.target.value,
                    });
                  }}
                  required
                  disabled={creating || updating}
                  className="form-select"
                >
                  <option value="" disabled>
                    Select a department
                  </option>
                  {departmentsData?.departments?.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName} ({dept.prefix})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="cancel-btn"
                  disabled={creating || updating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={creating || updating}
                >
                  {creating || updating ? (
                    <>
                      <div className="spinner-small"></div>
                      {editingCounter ? "Updating..." : "Creating..."}
                    </>
                  ) : editingCounter ? (
                    "Update Counter"
                  ) : (
                    "Create Counter"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCounter;
