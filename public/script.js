$(document).ready(function () {
  const apiUrl =
    'https://json-server-ft3qa5--3000.local.webcontainer.io/api/v1/courses';
  const logsApiUrl =
    'https://json-server-ft3qa5--3000.local.webcontainer.io/logs';

  const courseSelect = $('#course');
  const uvuIdInput = $('#uvuId');
  const uvuIdContainer = $('#uvuIdContainer');
  const logsContainer = $('ul[data-cy="logs"]');
  const uvuIdDisplay = $('#uvuIdDisplay');
  const logTextarea = $('textarea[data-cy="log_textarea"]');
  const addLogButton = $('button[data-cy="add_log_btn"]');
  const newLogContainer = $('#newLogContainer');
  const modeToggle = $('#modeToggle');
  const modeLabel = $('#modeLabel');
  const body = $('body');

  uvuIdContainer.hide();
  uvuIdDisplay.hide();
  logsContainer.hide();
  newLogContainer.hide();
  addLogButton.prop('disabled', true);

  let logsFetched = false;

  // Fetch and populate courses using jQuery
  $.get(apiUrl, function (coursesData) {
    coursesData.forEach(function (course) {
      courseSelect.append(
        $('<option></option>').val(course.id).text(course.display)
      );
    });
  }).fail(function (error) {
    console.error('Error fetching courses:', error);
  });

  courseSelect.on('change', function () {
    if (courseSelect.val()) {
      uvuIdContainer.show();
    } else {
      uvuIdContainer.hide();
    }
  });

  uvuIdInput.on('input', function () {
    const uvuId = uvuIdInput.val().replace(/\D/g, '');
    uvuIdInput.val(uvuId);

    if (uvuId.length === 8 && courseSelect.val()) {
      fetchLogs(uvuId, courseSelect.val());
    }
  });

  function fetchLogs(uvuId, courseId) {
    const url = `${logsApiUrl}?courseId=${courseId}&uvuId=${uvuId}`;

    $.get(url, function (response) {
      const logs = response.filter(
        (log) => log.courseId === courseId && log.uvuId === uvuId
      );

      logsContainer.empty();
      uvuIdDisplay.text(`Student Logs for ${uvuId}`).show();
      logsContainer.show();

      if (logs.length > 0) {
        logsFetched = true;
        logs.forEach(function (log) {
          const logDate = $('<div></div>').html(`<small>${log.date}</small>`);
          const logText = $('<pre></pre>').html(`<p>${log.text}</p>`);
          const li = $('<li></li>').append(logDate).append(logText);

          li.on('click', function () {
            logText.toggle();
          });

          logsContainer.append(li);
        });
      } else {
        logsFetched = false;
        logsContainer.html(
          '<li>No logs found for this UVU ID and course.</li>'
        );
      }

      newLogContainer.show();
      checkButtonState();
    }).fail(function (error) {
      console.error('Error fetching logs:', error);
      logsContainer.html('<li>Error loading logs. Please try again.</li>');
      logsFetched = false;
    });
  }

  function checkButtonState() {
    addLogButton.prop(
      'disabled',
      !(logsFetched && logTextarea.val().trim() !== '')
    );
  }

  logTextarea.on('input', checkButtonState);

  $('form').on('submit', function (event) {
    event.preventDefault();

    if (!addLogButton.prop('disabled')) {
      const newLog = {
        courseId: courseSelect.val(),
        uvuId: uvuIdInput.val(),
        date: new Date().toLocaleString(),
        text: logTextarea.val().trim(),
      };

      $.ajax({
        url: logsApiUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(newLog),
        success: function () {
          logTextarea.val('');
          addLogButton.prop('disabled', true);
          fetchLogs(uvuIdInput.val(), courseSelect.val());
        },
        error: function (error) {
          console.error('Error adding log:', error);
        },
      });
    }
  });

  // Dark/Light mode handling using Bootstrap utility classes
  function applyMode(theme) {
    if (theme === 'dark') {
      body.addClass('bg-dark text-light');
      body.removeClass('bg-light text-dark');
      modeLabel.text('Dark Mode');
    } else {
      body.addClass('bg-light text-dark');
      body.removeClass('bg-dark text-light');
      modeLabel.text('Light Mode');
    }
  }

  function getOSPref() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const osTheme = getOSPref();
    const theme = savedTheme || osTheme;
    applyMode(theme);
    modeToggle.prop('checked', theme === 'dark');
  }

  modeToggle.on('change', function () {
    const theme = modeToggle.is(':checked') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    applyMode(theme);
  });

  // Load the theme on page load
  loadTheme();
});
