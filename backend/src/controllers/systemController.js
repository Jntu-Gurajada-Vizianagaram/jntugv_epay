exports.getAnnouncement = (req, res) => {
  res.json({
    title: "Important Notice Regarding the Use of pay.jntugv.edu.in for University Payments",
    message: `It is hereby informed to all students, applicants, staff and other stakeholders that pay.jntugv.edu.in is currently under development and testing.

The said portal was provided as a live environment solely for the purpose of bank verification and technical integration. It is not authorized or approved for making any official payments to Jawaharlal Nehru Technological University – Gurajada Vizianagaram (JNTU-GV) at this stage.

Accordingly, all concerned are strictly advised:

DO NOT MAKE ANY OFFICIAL PAYMENT TO JNTU-GV THROUGH pay.jntugv.edu.in

The University will communicate the authorized payment portal(s) through official channels once the payment system has been fully tested, verified and officially launched.

All stakeholders are requested to take note of this notice and exercise due caution. Any transaction made through the above-mentioned portal during its development/testing stage shall be at the user's own risk, and the portal should not be treated as an authorized University payment gateway until further official notification.`
  });
};

exports.healthCheck = (req, res) => {
  res.json({ status: "OK" });
};

exports.getConfig = (req, res) => {
  res.json({ maintenanceMode: false });
};

exports.getMaintenanceStatus = (req, res) => {
  res.json({
    active: false,
    message: "No scheduled maintenance"
  });
};

exports.getLiveNotification = (req, res) => {
  res.json({ message: null });
};

exports.fullHealthStatus = (req, res) => {
  res.json({
    nginx: "OK",
    backend: "OK",
    mysql: "OK",
    payments: "OK"
  });
};
