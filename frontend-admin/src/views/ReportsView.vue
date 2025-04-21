<template>
  <div class="reports-container">
    <h1>Manage Reports</h1>
    <div v-if="isLoading" class="loading">Loading reports...</div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="!isLoading && !error && reports.length > 0" class="reports-table-container">
      <table class="reports-table">
        <thead>
          <tr>
            <th>Reported Quiz</th>
            <th>Reporter</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Reported At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="report in reports" :key="report._id" :class="`status-${report.status}`">
            <td>{{ report.quiz?.title || 'Quiz Deleted/Not Found' }}</td>
            <td>{{ report.reporter?.email || 'User Deleted/Not Found' }}</td>
            <td>{{ report.reason }}</td>
            <td>
              <select v-model="report.status" @change="updateReportStatus(report)" :disabled="isUpdatingStatus === report._id">
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </td>
            <td>{{ formatDate(report.createdAt) }}</td>
            <td>
              <button @click="deleteReport(report._id)" class="btn-delete" :disabled="isDeleting === report._id">
                {{ isDeleting === report._id ? 'Deleting...' : 'Delete' }}
              </button>
              <!-- Add link to view quiz/user if needed -->
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!isLoading && !error && reports.length === 0" class="no-reports">
      No reports found.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/utils/axios';

const reports = ref([]);
const isLoading = ref(true);
const error = ref(null);
const isUpdatingStatus = ref(null); // Track which report's status is being updated
const isDeleting = ref(null); // Track which report is being deleted

const fetchReports = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const { data } = await api.get('/api/admin/reports');
    // Ensure quiz and reporter are objects, even if null/undefined from populate
    reports.value = data.map(report => ({
        ...report,
        quiz: report.quiz || { title: 'N/A' }, // Provide default object if quiz is null
        reporter: report.reporter || { email: 'N/A' } // Provide default object if reporter is null
    }));
  } catch (err) {
    console.error('Failed to load reports:', err);
    error.value = err.response?.data?.message || 'Failed to load reports.';
  } finally {
    isLoading.value = false;
  }
};

const updateReportStatus = async (report) => {
  isUpdatingStatus.value = report._id;
  error.value = null;
  try {
    // Make the API call to update the status
    const { data: updatedReport } = await api.patch(`/api/admin/reports/${report._id}`, { status: report.status });

    // Update the local report data with the response (which includes populated fields if backend sends them)
    const index = reports.value.findIndex(r => r._id === report._id);
    if (index !== -1) {
        reports.value[index] = {
            ...updatedReport,
            quiz: updatedReport.quiz || { title: 'N/A' },
            reporter: updatedReport.reporter || { email: 'N/A' }
        };
    }
    console.log(`Updated status for report ${report._id} to ${report.status}`);

  } catch (err) {
    console.error('Failed to update report status:', err);
    error.value = err.response?.data?.message || 'Failed to update report status.';
    // Revert change in UI on failure by refetching all reports
    await fetchReports();
  } finally {
    isUpdatingStatus.value = null;
  }
};

const deleteReport = async (reportId) => {
  if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
    return;
  }
  isDeleting.value = reportId;
  error.value = null;
  try {
    await api.delete(`/api/admin/reports/${reportId}`);
    // Remove report from the local list
    reports.value = reports.value.filter(r => r._id !== reportId);
    console.log(`Deleted report ${reportId}`);
  } catch (err) {
    console.error('Failed to delete report:', err);
    error.value = err.response?.data?.message || 'Failed to delete report.';
  } finally {
    isDeleting.value = null;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

onMounted(fetchReports);
</script>

<style scoped>
.reports-container {
  padding: 2rem;
}

h1 {
  margin-bottom: 1.5rem;
}

.loading, .error-message, .no-reports {
  text-align: center;
  padding: 1rem;
  margin-top: 1rem;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.no-reports {
  color: #6c757d;
}

.reports-table-container {
  overflow-x: auto;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.reports-table th,
.reports-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
  vertical-align: middle;
}

.reports-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.reports-table tbody tr:hover {
  background-color: #f1f3f5;
}

.reports-table select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.reports-table button {
  padding: 0.3rem 0.7rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
}

.btn-delete:hover {
  background-color: #c82333;
}

.btn-delete:disabled,
.reports-table select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

/* Optional: Style rows based on status */
.status-pending td:first-child {
  border-left: 4px solid #ffc107; /* Yellow */
}
.status-resolved td:first-child {
  border-left: 4px solid #28a745; /* Green */
}
.status-dismissed td:first-child {
  border-left: 4px solid #6c757d; /* Gray */
}
</style>