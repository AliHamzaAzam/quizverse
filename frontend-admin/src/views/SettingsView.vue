<template>
  <div class="reports-container">
    <h1>Manage Reports</h1>

    <div v-if="loading" class="loading">Loading reports...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>
    <div v-else-if="reports.length === 0" class="no-reports">No reports found.</div>
    <div v-else class="reports-table-container">
      <table class="reports-table">
        <thead>
          <tr>
            <th>Report ID</th>
            <th>User</th>
            <th>Description</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="report in reports"
            :key="report.id"
            :class="`status-${report.status.toLowerCase()}`"
          >
            <td>{{ report.id }}</td>
            <td>{{ report.user }}</td>
            <td>{{ report.description }}</td>
            <td>
              <select v-model="report.status" @change="updateStatus(report)">
                <option>Pending</option>
                <option>Resolved</option>
                <option>Dismissed</option>
              </select>
            </td>
            <td>
              <button class="btn-delete" @click="deleteReport(report.id)">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SettingsView',
  data() {
    return {
      reports: [],
      loading: true,
      error: null,
    };
  },
  mounted() {
    this.fetchReports();
  },
  methods: {
    fetchReports() {
      // Simulate API fetch
      setTimeout(() => {
        try {
          // Dummy data
          this.reports = [
            { id: 1, user: 'Alice', description: 'Bug in module X', status: 'Pending' },
            { id: 2, user: 'Bob', description: 'Error 404 on settings', status: 'Resolved' },
            { id: 3, user: 'Charlie', description: 'Typo in FAQ section', status: 'Dismissed' },
          ];
        } catch (err) {
          this.error = 'Failed to fetch reports.';
        } finally {
          this.loading = false;
        }
      }, 1000);
    },
    updateStatus(report) {
      // Logic to update status, e.g., call API
      console.log(`Status for report ${report.id} updated to ${report.status}`);
    },
    deleteReport(id) {
      this.reports = this.reports.filter(r => r.id !== id);
      console.log(`Report ${id} deleted`);
    },
  },
};
</script>

<style scoped>
/* Your styles are already perfect and don't need changes */
</style>
