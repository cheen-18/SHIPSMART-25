// ShipSmart - Complete Enhanced Version
console.log('ShipSmart loading...');

// ==================== FIREBASE CONFIGURATION ====================

const firebaseConfig = {
    apiKey: "AIzaSyAWmXXvSRswvQBnAwrlOZprK-7H8xupjzM",
    authDomain: "shipment-tracking-2f377.firebaseapp.com",
    projectId: "shipment-tracking-2f377",
    storageBucket: "shipment-tracking-2f377.firebasestorage.app",
    messagingSenderId: "988485028683",
    appId: "1:988485028683:web:32d0eb3b857d447e87f6ce",
    measurementId: "G-FYQ7H10LNV",
    databaseURL: "https://shipment-tracking-2f377-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
let auth, database, analytics;
try {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    database = firebase.database();
    analytics = firebase.analytics();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// ==================== OPEN WEATHER CONFIGURATION ====================
// ==================== WEATHER FORECAST SYSTEM ====================

const WEATHER_API_KEY = '9068b994c9fbbc4c97d8efed60d35a29';
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Weather icon mapping
const weatherIcons = {
  '01d': 'sun',
  '01n': 'moon',
  '02d': 'cloud-sun',
  '02n': 'cloud-moon',
  '03d': 'cloud',
  '03n': 'cloud',
  '04d': 'cloud',
  '04n': 'cloud',
  '09d': 'cloud-rain',
  '09n': 'cloud-rain',
  '10d': 'cloud-sun-rain',
  '10n': 'cloud-moon-rain',
  '11d': 'bolt',
  '11n': 'bolt',
  '13d': 'snowflake',
  '13n': 'snowflake',
  '50d': 'smog',
  '50n': 'smog'
};

// Philippine cities coordinates
const philippineCities = {
  'manila': { lat: 14.5995, lng: 120.9842 },
  'cebu': { lat: 10.3157, lng: 123.8854 },
  'cebu city': { lat: 10.3157, lng: 123.8854 },
  'davao': { lat: 7.1907, lng: 125.4553 },
  'quezon city': { lat: 14.6760, lng: 121.0437 },
  'cainta': { lat: 14.5806, lng: 121.1231 },
  'rizal': { lat: 14.6506, lng: 121.1100 },
  'makati': { lat: 14.5547, lng: 121.0244 },
  'pasig': { lat: 14.5764, lng: 121.0851 },
  'antipolo': { lat: 14.6255, lng: 121.1245 }
};

// Initialize weather when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing weather system...');
  initializeDefaultWeather();
  setupWeatherEventListeners();
});

function setupWeatherEventListeners() {
  const updateWeatherBtn = document.querySelector('.weather-controls button');
  if (updateWeatherBtn) {
      updateWeatherBtn.onclick = null;
      updateWeatherBtn.addEventListener('click', updateWeatherFromInput);
  }
  
  const originInput = document.getElementById('originCity');
  const destInput = document.getElementById('destinationCity');
  
  if (originInput) {
      originInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') updateWeatherFromInput();
      });
  }
  
  if (destInput) {
      destInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') updateWeatherFromInput();
      });
  }
}

function updateWeatherFromInput() {
  const originCity = document.getElementById('originCity')?.value.trim();
  const destinationCity = document.getElementById('destinationCity')?.value.trim();
  
  if (!originCity || !destinationCity) {
      showNotification('Please enter both origin and destination cities', 'error');
      return;
  }
  
  console.log('Updating weather for:', originCity, '->', destinationCity);
  initializeWeatherData(originCity, destinationCity);
}

function getCoordinatesForCity(cityName) {
  if (!cityName) return philippineCities['manila'];
  
  const normalizedCity = cityName.toLowerCase().trim();
  
  if (philippineCities[normalizedCity]) {
      return philippineCities[normalizedCity];
  }
  
  for (const [city, coords] of Object.entries(philippineCities)) {
    if (normalizedCity.includes(city) || city.includes(normalizedCity)) {
        return coords;
    }
  }
  
  console.warn(`City not found: ${cityName}, defaulting to Manila`);
  return philippineCities['manila'];
}

async function fetchWeatherByCity(cityName, type) {
  try {
      const coords = getCoordinatesForCity(cityName);
      console.log(`Fetching weather for ${cityName} at coordinates:`, coords);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
          `${WEATHER_BASE_URL}?lat=${coords.lat}&lon=${coords.lng}&appid=${WEATHER_API_KEY}&units=metric`,
          { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
          throw new Error(`Weather API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Weather data for ${cityName}:`, data);
      return formatWeatherData(data, cityName, type);
      
  } catch (error) {
      console.error('Error fetching weather for', cityName, error);
      return getFallbackWeatherData(cityName, type);
  }
}

function formatWeatherData(data, locationName, type) {
  const iconCode = data.weather[0].icon;
  const icon = weatherIcons[iconCode] || 'cloud';
  
  return {
      location: locationName,
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      icon: icon,
      type: type,
      feelsLike: Math.round(data.main.feels_like),
      pressure: data.main.pressure,
      timestamp: new Date().toLocaleTimeString()
  };
}

function getFallbackWeatherData(locationName, type) {
  const isManila = locationName.toLowerCase().includes('manila');
  const isCebu = locationName.toLowerCase().includes('cebu');
  
  let baseTemp = 28;
  if (isCebu) baseTemp = 30;
  if (isManila) baseTemp = 29;
  
  const randomTemp = baseTemp + Math.floor(Math.random() * 4);
  const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Rain'];
  const weights = [0.3, 0.4, 0.2, 0.1];
  const randomCondition = conditions[getWeightedRandom(weights)];
  
  const conditionIcons = {
      'Clear': 'sun',
      'Partly Cloudy': 'cloud-sun',
      'Cloudy': 'cloud',
      'Rain': 'cloud-rain'
  };
  
  return {
      location: locationName,
      temperature: randomTemp,
      condition: randomCondition,
      description: randomCondition.toLowerCase(),
      humidity: Math.floor(Math.random() * 30) + 50,
      windSpeed: Math.floor(Math.random() * 10) + 5,
      icon: conditionIcons[randomCondition],
      type: type,
      feelsLike: randomTemp + 2,
      pressure: 1010 + Math.floor(Math.random() * 10),
      isFallback: true,
      timestamp: new Date().toLocaleTimeString() + ' (Sample Data)'
  };
}

function getWeightedRandom(weights) {
  const random = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) return i;
  }
  return weights.length - 1;
}

async function initializeWeatherData(originCity, destinationCity) {
  try {
      console.log('Initializing weather data for:', originCity, destinationCity);
      
      const weatherCards = document.getElementById('weatherCards');
      const alertContainer = document.getElementById('weatherAlertContainer');
      
      if (weatherCards) {
          weatherCards.innerHTML = `
              <div class="loading-weather">
                  <i class="fas fa-spinner fa-spin"></i> 
                  Loading weather data for ${originCity} and ${destinationCity}...
              </div>
          `;
      }
      
      if (alertContainer) {
          alertContainer.innerHTML = '';
      }

      const [originWeather, destinationWeather] = await Promise.all([
          fetchWeatherByCity(originCity, 'origin'),
          fetchWeatherByCity(destinationCity, 'destination')
      ]);
      
      displayWeatherData(originWeather, destinationWeather);
      analyzeWeatherImpact(originWeather, destinationWeather);
      
      storeCities(originCity, destinationCity);
      
  } catch (error) {
      console.error('Error initializing weather data:', error);
      showNotification('Error loading weather data. Using sample data.', 'warning');
      
      const originWeather = getFallbackWeatherData(originCity, 'origin');
      const destinationWeather = getFallbackWeatherData(destinationCity, 'destination');
      displayWeatherData(originWeather, destinationWeather);
  }
}

function displayWeatherData(originWeather, destinationWeather) {
  const weatherCards = document.getElementById('weatherCards');
  
  if (!weatherCards) {
      console.error('Weather cards element not found');
      return;
  }
  
  const originFallback = originWeather.isFallback ? '<div class="fallback-indicator">Sample Data</div>' : '';
  const destFallback = destinationWeather.isFallback ? '<div class="fallback-indicator">Sample Data</div>' : '';
  
  weatherCards.innerHTML = `
    <div class="weather-card origin-weather">
      <h4><i class="fas fa-map-marker-alt"></i> Origin: ${originWeather.location}</h4>
      ${originFallback}
      <div class="weather-icon">
        <i class="fas fa-${originWeather.icon}"></i>
      </div>
      <div class="weather-temp">${originWeather.temperature}°C</div>
      <div class="weather-condition">${originWeather.description}</div>
      <div class="weather-details">
        <div><i class="fas fa-wind"></i> ${originWeather.windSpeed} km/h</div>
        <div><i class="fas fa-tint"></i> ${originWeather.humidity}%</div>
        <div><i class="fas fa-temperature-low"></i> Feels like ${originWeather.feelsLike}°C</div>
      </div>
      <div class="weather-timestamp">${originWeather.timestamp}</div>
    </div>
    
    <div class="weather-card destination-weather">
      <h4><i class="fas fa-location-dot"></i> Destination: ${destinationWeather.location}</h4>
      ${destFallback}
      <div class="weather-icon">
        <i class="fas fa-${destinationWeather.icon}"></i>
      </div>
      <div class="weather-temp">${destinationWeather.temperature}°C</div>
      <div class="weather-condition">${destinationWeather.description}</div>
      <div class="weather-details">
        <div><i class="fas fa-wind"></i> ${destinationWeather.windSpeed} km/h</div>
        <div><i class="fas fa-tint"></i> ${destinationWeather.humidity}%</div>
        <div><i class="fas fa-temperature-low"></i> Feels like ${destinationWeather.feelsLike}°C</div>
      </div>
      <div class="weather-timestamp">${destinationWeather.timestamp}</div>
    </div>
  `;
}

function analyzeWeatherImpact(origin, destination) {
  const impacts = [];
  const alertContainer = document.getElementById('weatherAlertContainer');
  
  if (!alertContainer) return;
  
  alertContainer.innerHTML = '';
  
  if (origin.condition.toLowerCase().includes('rain') || origin.description.toLowerCase().includes('rain')) {
      impacts.push({
          message: 'Possible pickup delays due to rain at origin',
          severity: 'warning',
          icon: 'umbrella'
      });
  }
  
  if (destination.condition.toLowerCase().includes('rain') || destination.description.toLowerCase().includes('rain')) {
      impacts.push({
          message: 'Possible delivery delays due to rain at destination',
          severity: 'warning',
          icon: 'truck'
      });
  }
  
  if (origin.windSpeed > 30 || destination.windSpeed > 30) {
      impacts.push({
          message: 'High winds may affect transit times',
          severity: 'info',
          icon: 'wind'
      });
  }
  
  if (origin.temperature > 35 || destination.temperature > 35) {
      impacts.push({
          message: 'High temperatures may affect sensitive shipments',
          severity: 'info',
          icon: 'temperature-high'
      });
  }
  
  if (impacts.length > 0) {
      console.log('Weather impacts detected:', impacts);
      showWeatherAlert(impacts);
  }
}

function showWeatherAlert(impacts) {
  const alertContainer = document.getElementById('weatherAlertContainer');
  
  if (!alertContainer) return;
  
  const alertDiv = document.createElement('div');
  alertDiv.className = 'weather-alert';
  alertDiv.style.cssText = `
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
      color: #856404;
  `;

  alertDiv.innerHTML = `
      <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px; font-size: 16px;">
          <i class="fas fa-exclamation-triangle"></i> Weather Impact Alert
      </h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
          ${impacts.map(impact => `
              <div style="display: flex; align-items: center; gap: 8px; padding: 4px 0;">
                  <i class="fas fa-${impact.icon}" style="width: 16px;"></i>
                  <span>${impact.message}</span>
              </div>
          `).join('')}
      </div>
  `;

  alertContainer.appendChild(alertDiv);
}

function storeCities(origin, destination) {
  try {
      localStorage.setItem('weatherOrigin', origin);
      localStorage.setItem('weatherDestination', destination);
  } catch (error) {
      console.warn('Could not store cities in localStorage:', error);
  }
}

function getStoredOrigin() {
  try {
      return localStorage.getItem('weatherOrigin');
  } catch (error) {
      return null;
  }
}

function getStoredDestination() {
  try {
      return localStorage.getItem('weatherDestination');
  } catch (error) {
      return null;
  }
}

function initializeDefaultWeather() {
  const storedOrigin = getStoredOrigin();
  const storedDestination = getStoredDestination();
  
  if (storedOrigin && storedDestination) {
      initializeWeatherData(storedOrigin, storedDestination);
  } else {
      initializeWeatherData('Manila', 'Cainta');
  }
}

async function updateWeatherForShipment(shipmentData) {
  if (shipmentData && shipmentData.origin && shipmentData.destination) {
      const originCity = extractCityFromAddress(shipmentData.origin);
      const destinationCity = extractCityFromAddress(shipmentData.destination);
      
      console.log('Updating weather for shipment:', originCity, '->', destinationCity);
      await initializeWeatherData(originCity, destinationCity);
  }
}

function extractCityFromAddress(address) {
  if (!address) return 'Manila';
  
  const addressLower = address.toLowerCase();
  const cities = Object.keys(philippineCities);
  
  for (const city of cities) {
      if (addressLower.includes(city)) {
          return city.charAt(0).toUpperCase() + city.slice(1);
      }
  }
  
  return address.split(',')[0].trim() || 'Manila';
}

setInterval(initializeDefaultWeather, 10 * 60 * 1000);

if (typeof window !== 'undefined') {
  window.updateWeatherFromInput = updateWeatherFromInput;
  window.initializeWeatherData = initializeWeatherData;
}

// ==================== GLOBAL VARIABLES AND CONSTANTS ====================

let currentBooking = null;
let currentUserData = null;
const COD_FEE = 50.00;
const SERVICE_TYPES = {
    land: { name: 'Land Transport', rate: 100, icon: 'truck' },
    bulk: { name: 'Bulk Transport', rate: 80, icon: 'pallet' },
    courier: { name: 'Same-Day Courier', rate: 150, icon: 'motorcycle' }
};
const BOX_SIZES = {
    small: { multiplier: 1, dimensions: '30×30×30 cm' },
    medium: { multiplier: 1.5, dimensions: '50×40×40 cm' },
    large: { multiplier: 2.2, dimensions: '80×60×50 cm' },
    xl: { multiplier: 3.2, dimensions: '120×80×60 cm' },
    xxl: { multiplier: 5, dimensions: 'Pallet' }
};

// ==================== CORE APPLICATION FUNCTIONS ====================

function openLogin() {
  console.log('Opening login modal');
  const user = auth.currentUser;
  
  if (user) {
      database.ref('users/' + user.uid).once('value').then((snapshot) => {
          if (snapshot.exists()) {
              const userData = snapshot.val();
              if (userData.isAdmin === true) {
                  showNotification("Welcome Admin! Use the Admin Panel button to access admin features.", 'info');
                  return;
              }
          }
          showNotification("You're already logged in! Redirecting to booking...", 'success');
          window.location.hash = "#quote";
      });
      return;
  }
  
  const modal = document.getElementById("loginModal");
  console.log('Login modal element:', modal);
  
  if (modal) {
      modal.classList.remove("hidden");
      const emailInput = document.getElementById("li_email");
      const passInput = document.getElementById("li_pass");
      if (emailInput) emailInput.value = '';
      if (passInput) passInput.value = '';
      
      setTimeout(() => {
          if (emailInput) emailInput.focus();
      }, 300);
      
      console.log('Login modal opened successfully');
  } else {
      console.error('Login modal not found in DOM');
      showNotification('Please use the sign up form to create an account', 'info');
      window.location.hash = "#signup";
  }
}

function closeLogin() {
    const modal = document.getElementById("loginModal");
    if (modal) modal.classList.add("hidden");
}

function openSignUp() {
    closeLogin();
    window.location.hash = "#signup";
    setTimeout(() => {
        const nameInput = document.getElementById("su_name");
        if (nameInput) nameInput.focus();
    }, 100);
}

function scrollToContact() {
    const footer = document.querySelector('footer');
    if (footer) {
        footer.scrollIntoView({ behavior: 'smooth' });
    } else {
        window.location.hash = "#";
    }
}

function scrollToTop() {
    window.location.hash = "#home";
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function redirectToAdminPanel() {
  const user = auth.currentUser;
  
  if (!user) {
      showNotification("Please log in to access admin panel", 'error');
      openLogin();
      return;
  }
  
  database.ref('users/' + user.uid).once('value').then((snapshot) => {
      if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.isAdmin === true) {
              console.log('Admin confirmed, redirecting to admin panel...');
              showNotification("Redirecting to Admin Panel...", 'info');
              
              sessionStorage.setItem('adminRedirected', 'true');
              
              if (!window.location.pathname.endsWith('admin.html')) {
                  window.location.href = 'admin.html';
              }
          } else {
              showNotification("Access Denied: Admin privileges required", 'error');
          }
      }
  }).catch(error => {
      console.error('Error verifying admin status:', error);
      showNotification("Error verifying permissions", 'error');
  });
  
  closeLogin();
}

// ==================== COMPREHENSIVE AUTHENTICATION SYSTEM ====================

async function signupUser() {
    const name = document.getElementById("su_name")?.value.trim();
    const email = document.getElementById("su_email")?.value.trim();
    const password = document.getElementById("su_pass")?.value;
    const msg = document.getElementById("signupMsg");

    if (!name || !email || !password) {
        if (msg) {
            msg.textContent = "Please complete all fields.";
            msg.className = "form-message error";
        }
        return;
    }

    if (name.length < 2) {
        if (msg) {
            msg.textContent = "Please enter a valid name (at least 2 characters).";
            msg.className = "form-message error";
        }
        return;
    }

    if (!isValidEmail(email)) {
        if (msg) {
            msg.textContent = "Please enter a valid email address.";
            msg.className = "form-message error";
        }
        return;
    }

    if (password.length < 6) {
        if (msg) {
            msg.textContent = "Password must be at least 6 characters long.";
            msg.className = "form-message error";
        }
        return;
    }

    try {
        showLoadingState(true);
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await user.sendEmailVerification();
        
        await database.ref('users/' + user.uid).set({
            name: name,
            email: email,
            emailVerified: false,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            accountType: 'customer',
            preferences: {
                emailNotifications: true,
                smsNotifications: false,
                newsletter: true
            },
            stats: {
                totalShipments: 0,
                totalSpent: 0,
                joinedDate: new Date().toISOString()
            }
        });
        
        analytics.logEvent('sign_up', { 
            method: 'email',
            user_id: user.uid
        });
        
        if (msg) {
            msg.textContent = "Account created successfully! Please check your email to verify your account. You can now login.";
            msg.className = "form-message success";
        }
        
        document.getElementById("su_name").value = "";
        document.getElementById("su_email").value = "";
        document.getElementById("su_pass").value = "";
        
        setTimeout(() => {
            closeLogin();
            window.location.hash = "#home";
            showNotification("Account created successfully! Please verify your email.", 'success');
        }, 3000);
        
    } catch (error) {
        console.error('Signup error:', error);
        if (msg) {
            msg.textContent = getFirebaseErrorMessage(error);
            msg.className = "form-message error";
        }
    } finally {
        showLoadingState(false);
    }
}

async function doLoginAction() {
  const email = document.getElementById("li_email")?.value.trim();
  const password = document.getElementById("li_pass")?.value;
  const rememberMe = document.getElementById("rememberMe")?.checked || false;

  if (!email || !password) {
      showNotification("Please enter both email and password", 'error');
      return;
  }

  try {
      showLoadingState(true, 'doLogin');
      
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      localStorage.setItem('shipsmart_rememberme', rememberMe.toString());
      if (rememberMe) {
          localStorage.setItem('shipsmart_user_email', email);
      }
      
      await database.ref('users/' + user.uid).update({
          lastLogin: new Date().toISOString()
      });
      
      const userSnapshot = await database.ref('users/' + user.uid).once('value');
      currentUserData = userSnapshot.val();
      
      analytics.logEvent('login', { 
          method: 'email',
          user_id: user.uid
      });
      
      closeLogin();
      showNotification(`Welcome back, ${currentUserData?.name || user.email}!`, 'success');
      
      setTimeout(() => {
          window.location.hash = "#quote";
          showNotification("You can now book your shipment!", 'info');
          
          setTimeout(() => {
              const quoteSection = document.getElementById('quote');
              if (quoteSection) {
                  quoteSection.scrollIntoView({ behavior: 'smooth' });
              }
          }, 200);
      }, 1000);
      
  } catch (error) {
      console.error('Login error:', error);
      showNotification(getFirebaseErrorMessage(error), 'error');
  } finally {
      showLoadingState(false, 'doLogin');
  }
}

async function forgotPassword() {
    const email = prompt("Enter your email address to reset password:");
    if (!email) return;
    
    if (!isValidEmail(email)) {
        showNotification("Please enter a valid email address", 'error');
        return;
    }

    try {
        showLoadingState(true);
        await auth.sendPasswordResetEmail(email);
        showNotification("Password reset email sent! Check your inbox and spam folder.", 'success');
    } catch (error) {
        console.error('Password reset error:', error);
        showNotification(getFirebaseErrorMessage(error), 'error');
    } finally {
        showLoadingState(false);
    }
}

async function logout() {
    try {
        showLoadingState(true);
        await auth.signOut();
        currentUserData = null;
        currentBooking = null;
        showNotification("You have been logged out successfully.", 'info');
        
        setTimeout(() => {
            window.location.hash = "#home";
        }, 1000);
        
    } catch (error) {
        console.error("Logout error:", error);
        showNotification("Error during logout. Please try again.", 'error');
    } finally {
        showLoadingState(false);
    }
}

function updateAuthUI(user) {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const bookNowTop = document.getElementById("bookNowTop");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const adminPanelBtn = document.getElementById("adminPanelBtn");

  if (user) {
      if (loginBtn) loginBtn.classList.add("hidden");
      if (logoutBtn) { 
          logoutBtn.classList.remove("hidden"); 
          logoutBtn.onclick = logout;
      }
      if (dashboardBtn) {
          dashboardBtn.classList.remove("hidden");
          dashboardBtn.onclick = showDashboard;
      }
      if (bookNowTop) {
          bookNowTop.innerHTML = '<i class="fas fa-box"></i> Book Shipment';
          bookNowTop.classList.remove('btn-ghost');
          bookNowTop.classList.add('btn-primary');
      }
      
      database.ref('users/' + user.uid).once('value')
          .then((snapshot) => {
              if (snapshot.exists()) {
                  const userData = snapshot.val();
                  currentUserData = userData;
                  console.log("User logged in:", userData.name);
                  
                  if (userData.isAdmin === true) {
                    if (adminPanelBtn) adminPanelBtn.classList.remove("hidden");
                    console.log("Admin privileges detected");
                    
                    if (adminPanelBtn) {
                        adminPanelBtn.classList.add('btn-pulse');
                        adminPanelBtn.innerHTML = '<i class="fas fa-user-shield"></i> ADMIN PANEL →';
                        adminPanelBtn.onclick = redirectToAdminPanel;
                    }
                    
                    const isOnMainPage = window.location.pathname.endsWith('index.html') || 
                                       window.location.pathname === '/' || 
                                       window.location.pathname.endsWith('/');
                    const isOnAdminPage = window.location.pathname.endsWith('admin.html');
                    const alreadyRedirected = sessionStorage.getItem('adminRedirected');
                    
                    if (isOnMainPage && !isOnAdminPage && !alreadyRedirected) {
                        sessionStorage.setItem('adminRedirected', 'true');
                        console.log('Auto-redirecting admin to admin panel...');
                        
                        showNotification("🎯 Welcome Admin! Redirecting to Admin Panel...", 'info', 2000);
                        
                        setTimeout(() => {
                            window.location.replace('admin.html');
                        }, 1500);
                    }
                  } else {
                    if (adminPanelBtn) adminPanelBtn.classList.add("hidden");
                  }
                  
                  if (user.emailVerified === false) {
                      showNotification("Please verify your email address to access all features.", 'warning');
                  }
                  
                  updateUserStatsInUI(userData);
              }
          })
          .catch(error => {
              console.error('Error fetching user data:', error);
          });
          
  } else {
      if (loginBtn) loginBtn.classList.remove("hidden");
      if (logoutBtn) logoutBtn.classList.add("hidden");
      if (dashboardBtn) {
          dashboardBtn.classList.add("hidden");
      }
      if (adminPanelBtn) adminPanelBtn.classList.add("hidden");
      if (bookNowTop) {
          bookNowTop.innerHTML = '<i class="fas fa-box"></i> Book Now';
          bookNowTop.classList.remove('btn-primary');
          bookNowTop.classList.add('btn-ghost');
      }
      
      currentUserData = null;
      sessionStorage.removeItem('adminRedirected');
  }
}

// ==================== SHIPMENT MANAGEMENT SYSTEM ====================

function generateTrackingNumber() {
    const prefix = 'SS';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}-${random}`;
}

async function createShipment(shipmentData, paymentMethod, totalCost) {
  const user = firebase.auth().currentUser;
  if (!user) {
      showNotification("Please login to create a shipment", 'error');
      openLogin();
      return null;
  }

  if (user.emailVerified === false) {
      const proceed = confirm("Your email is not verified. Some features may be limited. Would you like to continue anyway?");
      if (!proceed) return null;
  }

  const trackingNumber = generateTrackingNumber();
  
  try {
      showLoadingState(true);
      
      const shippingMode = shipmentData.serviceType || 'land';
      const serviceInfo = SERVICE_TYPES[shippingMode] || SERVICE_TYPES.land;
      
      const shipmentRecord = {
          userId: user.uid,
          trackingNumber: trackingNumber,
          status: (paymentMethod === 'cod') ? 'booked' : 'pending_payment',
          origin: shipmentData.pickup,
          destination: shipmentData.dropoff,
          packageDetails: {
              boxSize: shipmentData.boxSize,
              quantity: shipmentData.quantity,
              weight: shipmentData.weight,
              packaging: shipmentData.packaging,
              dimensions: BOX_SIZES[shipmentData.boxSize]?.dimensions || 'N/A',
              declaredValue: shipmentData.declaredValue || 0
          },
          shippingMode: shippingMode,
          serviceName: serviceInfo.name,
          cost: shipmentData.total,
          totalCost: totalCost,
          paymentMethod: paymentMethod,
          paymentStatus: (paymentMethod === 'cod') ? 'unpaid' : 'awaiting_admin_approval',
          recipientName: window.currentPaymentBooking?.recipientName || '',
          recipientPhone: window.currentPaymentBooking?.recipientPhone || '',
          senderName: user.displayName || user.email,
          senderEmail: user.email,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(),
          history: [
              {
                  status: (paymentMethod === 'cod') ? 'booked' : 'pending_payment',
                  timestamp: new Date().toISOString(),
                  description: 'Shipment created and awaiting processing'
              }
          ]
      };
      
      if (paymentMethod === 'cod') {
          shipmentRecord.codFee = COD_FEE;
      }
      
      await database.ref('shipments/' + trackingNumber).set(shipmentRecord);
      
      await database.ref('userShipments/' + user.uid + '/' + trackingNumber).set({
          createdAt: new Date().toISOString(),
          status: shipmentRecord.status
      });
      
      await database.ref('userRecentShipments/' + user.uid).set({
          [trackingNumber]: new Date().toISOString()
      });
      
      await updateUserStats(user.uid, totalCost);
      
      analytics.logEvent('create_shipment', { 
          tracking_number: trackingNumber,
          shipping_mode: shippingMode,
          cost: totalCost,
          payment_method: paymentMethod,
          user_id: user.uid
      });
      
      console.log('Shipment created successfully with recipient info:', trackingNumber);
      return trackingNumber;
      
  } catch (error) {
      console.error("Error creating shipment:", error);
      showNotification("Error creating shipment. Please try again.", 'error');
      throw error;
  } finally {
      showLoadingState(false);
  }
}

async function updateUserStats(userId, cost) {
    try {
        const userRef = database.ref('users/' + userId + '/stats');
        const snapshot = await userRef.once('value');
        const currentStats = snapshot.val() || { totalShipments: 0, totalSpent: 0 };
        
        await userRef.update({
            totalShipments: (currentStats.totalShipments || 0) + 1,
            totalSpent: (currentStats.totalSpent || 0) + cost,
            lastShipmentDate: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating user stats:', error);
    }
}

// ==================== ENHANCED TRACKING SYSTEM ====================

async function trackShipment() {
  const codeInput = document.getElementById("trackCode");
  const code = codeInput?.value.trim().toUpperCase();
  const result = document.getElementById("trackingResult");
  const eta = document.getElementById("eta");

  if (!result) {
    console.error('Tracking result element not found');
    return;
  }

  // Clear previous results
  result.innerHTML = "";
  if (eta) {
    eta.classList.add("hidden");
    eta.innerHTML = "";
  }

  if (!code) {
    result.innerHTML = `
      <div class="muted text-center">
        <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; color: #64748b;"></i>
        <p>Please enter a tracking number to get started.</p>
        <p class="small" style="margin-top: 0.5rem;">Example: SS-2024-0001</p>
      </div>`;
    return;
  }

  if (!isValidTrackingNumber(code)) {
    result.innerHTML = `
      <div class="text-center">
        <i class="fas fa-exclamation-triangle" style="color: #f59e0b; font-size: 2rem; margin-bottom: 1rem;"></i>
        <p class="muted">Invalid tracking number format.</p>
        <p class="muted small">Tracking numbers should look like: SS-2024-0001</p>
      </div>`;
    return;
  }

  // Show loading state
  result.innerHTML = `
    <div class="text-center">
      <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; color: #3498db;"></i>
      <p class="muted">Searching for shipment ${code}...</p>
    </div>`;

  try {
      showLoadingState(true, 'tracking');
      
      const user = auth.currentUser;
      
      if (!user) {
          result.innerHTML = `
              <div class="text-center">
                  <i class="fas fa-lock" style="color: #ef4444; font-size: 2rem; margin-bottom: 1rem;"></i>
                  <p class="muted">Please log in to track your shipment.</p>
                  <button class="btn btn-primary mt-2" onclick="openLogin()">Login to Track</button>
              </div>`;
          return;
      }

      const shipmentSnapshot = await database.ref('shipments/' + code).once('value');
      
      if (!shipmentSnapshot.exists()) {
          result.innerHTML = `
              <div class="text-center">
                  <i class="fas fa-box-open" style="color: #f59e0b; font-size: 2rem; margin-bottom: 1rem;"></i>
                  <p class="muted">Tracking number not found in our system.</p>
                  <p class="muted small">Please check the number and try again.</p>
              </div>`;
          return;
      }
      
      const shipment = shipmentSnapshot.val();
      
      analytics.logEvent('track_shipment', { 
          tracking_number: code,
          status: shipment.status,
          user_id: user.uid
      });
      
      displayTrackingInfo(shipment, result, eta, true);
      
  } catch (error) {
      console.error('Tracking error:', error);
      
      if (error.code === 'PERMISSION_DENIED' || error.message.includes('permission_denied')) {
          result.innerHTML = `
              <div class="text-center">
                  <i class="fas fa-ban" style="color: #ef4444; font-size: 2rem; margin-bottom: 1rem;"></i>
                  <p class="muted"><strong>Access Denied</strong></p>
                  <p class="muted">This tracking number doesn't belong to your account.</p>
                  <p class="muted small">You can only track shipments that you created.</p>
                  <div class="mt-3">
                      <button class="btn btn-primary" onclick="openLogin()">
                          <i class="fas fa-sign-in-alt"></i> Switch Account
                      </button>
                      <button class="btn btn-outline ml-2" onclick="window.location.hash = '#quote'">
                          <i class="fas fa-plus"></i> Create New Shipment
                      </button>
                  </div>
              </div>`;
      } else {
          result.innerHTML = `
              <div class="text-center">
                  <i class="fas fa-exclamation-circle" style="color: #ef4444; font-size: 2rem; margin-bottom: 1rem;"></i>
                  <p class="muted">Error fetching tracking information.</p>
                  <p class="muted small">Please check your connection and try again.</p>
              </div>`;
      }
  } finally {
      showLoadingState(false, 'tracking');
  }
}

function displayTrackingInfo(shipment, result, eta, isOwner) {
  const created = new Date(shipment.createdAt);
  const estimatedDelivery = new Date(shipment.estimatedDelivery);
  const daysLeft = Math.ceil((estimatedDelivery - new Date()) / (1000 * 60 * 60 * 24));
  const isDelivered = shipment.status === 'delivered';
  
  if (eta) {
      if (isDelivered) {
          eta.textContent = `Delivered on ${new Date(shipment.deliveredAt).toLocaleDateString()}`;
      } else {
          eta.textContent = `ETA: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — ${estimatedDelivery.toLocaleDateString()}`;
      }
      eta.classList.remove("hidden");
  }

  const statusConfig = {
      'pending_payment': { 
          progress: 10, 
          color: '#ef4444', 
          icon: 'fa-file-invoice', 
          description: 'Awaiting payment confirmation',
          nextStep: 'Payment verification'
      },
      'booked': { 
          progress: 25, 
          color: '#f59e0b', 
          icon: 'fa-clipboard-check', 
          description: 'Shipment has been booked and is awaiting pickup',
          nextStep: 'Pickup scheduled'
      },
      'picked_up': { 
          progress: 50, 
          color: '#3b82f6', 
          icon: 'fa-truck-pickup', 
          description: 'Package has been picked up from sender',
          nextStep: 'In transit processing'
      },
      'in_transit': { 
          progress: 75, 
          color: '#8b5cf6', 
          icon: 'fa-truck-moving', 
          description: 'Package is in transit to destination',
          nextStep: 'Out for delivery'
      },
      'out_for_delivery': { 
          progress: 90, 
          color: '#06b6d4', 
          icon: 'fa-truck-ramp-box', 
          description: 'Package is out for delivery today',
          nextStep: 'Delivery completion'
      },
      'delivered': { 
          progress: 100, 
          color: '#10b981', 
          icon: 'fa-check-circle', 
          description: 'Package has been delivered successfully',
          nextStep: 'Completed'
      }
  };

  const config = statusConfig[shipment.status] || statusConfig.booked;

  result.innerHTML = `
      <div class="tracking-header">
          <h4><i class="fas ${config.icon}" style="color: ${config.color};"></i> Status: ${formatStatus(shipment.status)}</h4>
          <div class="tracking-number">${shipment.trackingNumber}</div>
      </div>
      
      <div class="status-description">
          <p>${config.description}</p>
          ${!isDelivered ? `<p class="small muted"><strong>Next:</strong> ${config.nextStep}</p>` : ''}
      </div>
      
      <div class="progress-container">
          <div class="progress-bar">
              <div class="progress-fill" style="width: ${config.progress}%; background: ${config.color};"></div>
          </div>
          <div class="progress-label">${config.progress}% Complete</div>
      </div>
      
      <div class="status-preview">
          <div class="status-steps">
              <div class="status-step ${shipment.status === 'booked' || shipment.status === 'picked_up' || shipment.status === 'in_transit' || shipment.status === 'out_for_delivery' || shipment.status === 'delivered' ? 'active' : ''}">
                  <div class="step-icon"><i class="fas fa-clipboard-check"></i></div>
                  <div class="step-label">Booked</div>
              </div>
              <div class="status-step ${shipment.status === 'picked_up' || shipment.status === 'in_transit' || shipment.status === 'out_for_delivery' || shipment.status === 'delivered' ? 'active' : ''}">
                  <div class="step-icon"><i class="fas fa-truck-pickup"></i></div>
                  <div class="step-label">Picked Up</div>
              </div>
              <div class="status-step ${shipment.status === 'in_transit' || shipment.status === 'out_for_delivery' || shipment.status === 'delivered' ? 'active' : ''}">
                  <div class="step-icon"><i class="fas fa-truck-moving"></i></div>
                  <div class="step-label">In Transit</div>
              </div>
              <div class="status-step ${shipment.status === 'out_for_delivery' || shipment.status === 'delivered' ? 'active' : ''}">
                  <div class="step-icon"><i class="fas fa-truck-ramp-box"></i></div>
                  <div class="step-label">Out for Delivery</div>
              </div>
              <div class="status-step ${shipment.status === 'delivered' ? 'active' : ''}">
                  <div class="step-icon"><i class="fas fa-check-circle"></i></div>
                  <div class="step-label">Delivered</div>
              </div>
          </div>
      </div>
      
      <div class="tracking-details">
          <div class="detail-row">
              <span class="detail-label"><i class="fas fa-map-marker-alt"></i> From:</span>
              <span class="detail-value">${shipment.origin}</span>
          </div>
          <div class="detail-row">
              <span class="detail-label"><i class="fas fa-location-dot"></i> To:</span>
              <span class="detail-value">${shipment.destination}</span>
          </div>
          <div class="detail-row">
              <span class="detail-label"><i class="fas fa-${getShippingModeIcon(shipment.shippingMode)}"></i> Service:</span>
              <span class="detail-value">${shipment.serviceName || formatStatus(shipment.shippingMode)}</span>
          </div>
          <div class="detail-row">
              <span class="detail-label"><i class="fas fa-weight-hanging"></i> Weight:</span>
              <span class="detail-value">${shipment.packageDetails.weight} kg</span>
          </div>
          <div class="detail-row">
              <span class="detail-label"><i class="fas fa-box"></i> Dimensions:</span>
              <span class="detail-value">${BOX_SIZES[shipment.packageDetails.boxSize]?.dimensions || 'N/A'}</span>
          </div>
          <div class="detail-row">
              <span class="detail-label"><i class="fas fa-money-bill-wave"></i> Total Cost:</span>
              <span class="detail-value">₱${shipment.totalCost ? shipment.totalCost.toFixed(2) : shipment.cost.toFixed(2)}</span>
          </div>
          <div class="detail-row">
              <span class="detail-label"><i class="fas fa-wallet"></i> Payment:</span>
              <span class="detail-value">${formatStatus(shipment.paymentMethod)} (${formatStatus(shipment.paymentStatus || 'unknown')})</span>
          </div>
          <div class="detail-row">
              <span class="detail-label"><i class="fas fa-calendar"></i> Created:</span>
              <span class="detail-value">${new Date(shipment.createdAt).toLocaleString()}</span>
          </div>
          <div class="detail-row">
              <span class="detail-label"><i class="fas fa-sync"></i> Last Updated:</span>
              <span class="detail-value">${new Date(shipment.updatedAt).toLocaleString()}</span>
          </div>
          ${shipment.status === 'delivered' && shipment.deliveredAt ? `
              <div class="detail-row delivered-row">
                  <span class="detail-label"><i class="fas fa-check-circle"></i> Delivered At:</span>
                  <span class="detail-value">${new Date(shipment.deliveredAt).toLocaleString()}</span>
              </div>
          ` : ''}
      </div>
      
      ${isOwner ? `
          <div class="tracking-actions">
              ${shipment.status === 'pending_payment' && ['bank', 'gcash'].includes(shipment.paymentMethod) ? `
                  <button class="btn btn-primary" onclick="openPaymentModal({ cost: ${shipment.cost}, totalCost: ${shipment.totalCost} }, '${shipment.trackingNumber}')">
                      <i class="fas fa-file-invoice-dollar"></i> Complete Payment
                  </button>
              ` : ''}
              <button class="btn btn-outline" onclick="copyTrackingNumber('${shipment.trackingNumber}')">
                  <i class="fas fa-copy"></i> Copy Tracking
              </button>
              <button class="btn btn-outline" onclick="shareTracking('${shipment.trackingNumber}')">
                  <i class="fas fa-share-alt"></i> Share
              </button>
          </div>
      ` : ''}
  `;
}

// ==================== ADVANCED QUOTE CALCULATOR SYSTEM ====================

async function computeQuote() {
    const boxSize = document.getElementById("boxSize")?.value;
    const quantity = parseInt(document.getElementById("quantity")?.value) || 1;
    const weight = parseFloat(document.getElementById("weight")?.value) || 0;
    const packaging = document.getElementById("packaging")?.value;
    const serviceType = document.getElementById("serviceType")?.value;
    const declared = parseFloat(document.getElementById("declaredValue")?.value) || 0;
    const pickup = document.getElementById("pickup")?.value.trim();
    const dropoff = document.getElementById("dropoff")?.value.trim();
    const dimensions = document.getElementById("dimensions")?.value.trim();

    const output = document.getElementById("quoteOutput");
    const breakdown = document.getElementById("breakdown");
    const totalEl = document.getElementById("quoteTotal");

    if (!output || !breakdown || !totalEl) return;

    if (!pickup || !dropoff) {
        showNotification("Please provide both pickup and drop-off locations.", 'error');
        return;
    }
    
    if (!weight || weight <= 0) {
        showNotification("Please enter a valid weight greater than 0.", 'error');
        return;
    }

    if (weight > 1000) {
        showNotification("Weight exceeds maximum limit of 1000kg. Please contact us for oversized shipments.", 'error');
        return;
    }

    if (!serviceType) {
        showNotification("Please select a service type.", 'error');
        return;
    }

    if (quantity > 100) {
        showNotification("Quantity exceeds maximum limit of 100 items. Please contact us for bulk orders.", 'error');
        return;
    }

    try {
        showLoadingState(true, 'quote');
        
        const serviceInfo = SERVICE_TYPES[serviceType] || SERVICE_TYPES.land;
        const boxInfo = BOX_SIZES[boxSize] || BOX_SIZES.medium;
        
        const baseRate = serviceInfo.rate;
        const boxMultiplier = boxInfo.multiplier;
        const packagingCost = packaging === "provider" ? 120 : 0;
        
        const baseShipping = baseRate * weight * boxMultiplier;
        const quantityCost = baseShipping * quantity;
        const insurance = declared > 0 ? declared * 0.02 : 0;
        const handlingFee = calculateHandlingFee(weight, boxSize);
        const distanceSurcharge = calculateDistanceSurcharge(pickup, dropoff);
        const fuelSurcharge = quantityCost * 0.05;
        
        const subtotal = quantityCost + packagingCost + handlingFee + distanceSurcharge + fuelSurcharge;
        const insuranceTotal = insurance * quantity;
        const total = subtotal + insuranceTotal;

        const quoteData = {
            boxSize: boxSize,
            quantity: quantity,
            weight: weight,
            packaging: packaging,
            serviceType: serviceType,
            declaredValue: declared,
            pickup: pickup,
            dropoff: dropoff,
            dimensions: dimensions,
            total: total,
            calculatedAt: new Date().toISOString(),
            breakdown: {
                baseShipping: baseShipping,
                quantityCost: quantityCost,
                packagingCost: packagingCost,
                handlingFee: handlingFee,
                distanceSurcharge: distanceSurcharge,
                fuelSurcharge: fuelSurcharge,
                insurance: insuranceTotal
            }
        };

        if (auth.currentUser) {
            await saveQuote(quoteData);
        }

        output.classList.remove("hidden");
        breakdown.innerHTML = `
            <div class="breakdown-item">
                <span>Base Shipping (${serviceInfo.name})</span>
                <span>₱${baseShipping.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
                <span>Packaging (${packaging === 'provider' ? 'We provide' : 'Customer provides'})</span>
                <span>₱${packagingCost.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
                <span>Quantity (${quantity} items)</span>
                <span>₱${quantityCost.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
                <span>Handling & Processing</span>
                <span>₱${handlingFee.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
                <span>Distance Surcharge</span>
                <span>₱${distanceSurcharge.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
                <span>Fuel Surcharge (5%)</span>
                <span>₱${fuelSurcharge.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
                <span>Insurance ${declared > 0 ? `(2% of ₱${declared.toFixed(2)})` : ''}</span>
                <span>₱${insuranceTotal.toFixed(2)}</span>
            </div>
            <div class="breakdown-item total-breakdown">
                <span><strong>Total Shipping Cost</strong></span>
                <span><strong>₱${total.toFixed(2)}</strong></span>
            </div>
        `;
        
        totalEl.textContent = `TOTAL ESTIMATED COST: ₱${total.toFixed(2)}`;

        currentBooking = { 
            quote: quoteData, 
            cost: total, 
            paymentMethod: null, 
            totalCost: total 
        };

        analytics.logEvent('calculate_quote', {
            service_type: serviceType,
            weight: weight,
            quantity: quantity,
            total_cost: total
        });

    } catch (error) {
        console.error('Quote calculation error:', error);
        showNotification("Error calculating quote. Please try again.", 'error');
    } finally {
        showLoadingState(false, 'quote');
    }
}

function calculateHandlingFee(weight, boxSize) {
    let baseFee = 120;
    
    if (weight > 50) baseFee += 50;
    if (weight > 100) baseFee += 100;
    
    const sizeMultipliers = { small: 1, medium: 1.2, large: 1.5, xl: 2, xxl: 3 };
    const sizeMultiplier = sizeMultipliers[boxSize] || 1;
    
    return baseFee * sizeMultiplier;
}

function calculateDistanceSurcharge(pickup, dropoff) {
    let surcharge = 0;
    
    const majorCities = ['manila', 'cebu', 'davao', 'quezon city', 'makati', 'pasig', 'taguig'];
    
    const isPickupMajor = majorCities.some(city => pickup.toLowerCase().includes(city));
    const isDropoffMajor = majorCities.some(city => dropoff.toLowerCase().includes(city));
    
    if (!isPickupMajor) surcharge += 50;
    if (!isDropoffMajor) surcharge += 50;
    
    return surcharge;
}

async function saveQuote(quoteData) {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        const quoteId = 'quote_' + new Date().getTime();
        await database.ref('quotes/' + user.uid + '/' + quoteId).set({
            ...quoteData,
            userId: user.uid,
            createdAt: new Date().toISOString()
        });
        return quoteId;
    } catch (error) {
        console.error("Error saving quote:", error);
        return null;
    }
}

async function proceedToBooking() {
  const user = auth.currentUser;
  if (!user) {
      showNotification("Please login to book a shipment", 'error');
      openLogin();
      return;
  }

  if (!currentBooking || !currentBooking.quote) {
      showNotification("Please calculate a quote first", 'error');
      return;
  }

  const quoteOutput = document.getElementById("quoteOutput");
  if (!quoteOutput || quoteOutput.classList.contains('hidden')) {
      showNotification("Please calculate a quote first", 'error');
      return;
  }

  const totalEl = document.getElementById("quoteTotal");
  let totalCost = currentBooking.cost;
  
  if (totalEl) {
      const totalText = totalEl.textContent;
      const match = totalText.match(/₱([\d,.]+)/);
      if (match) {
          totalCost = parseFloat(match[1].replace(/,/g, ''));
      }
  }

  const bookingData = {
      quote: {
          ...currentBooking.quote,
          trackingNumber: generateTrackingNumber()
      },
      cost: currentBooking.cost,
      totalCost: totalCost,
      paymentMethod: null
  };

  console.log('Proceeding to booking with data:', bookingData);
  openPaymentModal(bookingData);
}

// ==================== PAYMENT SYSTEM ====================

// Payment System Variables
let selectedPaymentMethod = null;
let currentBookingData = null;
let currentPaymentModal = null;

function openPaymentModal(bookingData) {
    currentBookingData = bookingData;
    selectedPaymentMethod = null;
    
    // Close any existing modals first
    closePaymentModal();
    
    // Create payment modal with recipient section
    const modal = document.createElement('div');
    modal.className = 'modal-wrap';
    modal.innerHTML = `
        <div class="modal-card" style="max-width: 600px;">
            <button class="modal-close" id="paymentModalClose">
                <i class="fas fa-times"></i>
            </button>
            
            <h3>Complete Booking</h3>
            
            <div class="recipient-info-section">
                <h4><i class="fas fa-user-check"></i> Recipient Information</h4>
                <div class="field">
                    <label for="recipientName"><i class="fas fa-user"></i> Recipient Full Name *</label>
                    <input type="text" id="recipientName" placeholder="Enter recipient's full name" required>
                </div>
                <div class="field">
                    <label for="recipientPhone"><i class="fas fa-phone"></i> Recipient Phone Number</label>
                    <input type="tel" id="recipientPhone" placeholder="Optional: recipient's phone number">
                </div>
            </div>

            <div class="payment-summary">
                <h4>Order Summary</h4>
                <div class="summary-item">
                    <span>Shipping Cost:</span>
                    <span>₱<span id="shipping-amount">${bookingData.cost.toFixed(2)}</span></span>
                </div>
                <div class="summary-item hidden" id="cod-fee-item">
                    <span>COD Fee:</span>
                    <span>₱${COD_FEE.toFixed(2)}</span>
                </div>
                <div class="summary-item total">
                    <span><strong>Total Amount:</strong></span>
                    <span><strong>₱<span id="total-amount">${bookingData.cost.toFixed(2)}</span></strong></span>
                </div>
            </div>
            
            <div class="payment-methods">
                <h4>Select Payment Method</h4>
                
                <div class="payment-option">
                    <input type="radio" id="cod" name="paymentMethod" value="cod">
                    <label for="cod" class="payment-label">
                        <div class="payment-icon"><i class="fas fa-money-bill-wave"></i></div>
                        <div class="payment-info">
                            <strong>Cash on Delivery</strong>
                            <small>Pay when you receive your package</small>
                        </div>
                    </label>
                </div>
                
                <div class="payment-option">
                    <input type="radio" id="gcash" name="paymentMethod" value="gcash">
                    <label for="gcash" class="payment-label">
                        <div class="payment-icon"><i class="fas fa-mobile-alt"></i></div>
                        <div class="payment-info">
                            <strong>GCash</strong>
                            <small>Mobile payment</small>
                        </div>
                    </label>
                </div>
            </div>

            <div id="gcash-reference-section" class="field">
                <label for="gcashReference">
                    <i class="fas fa-receipt"></i> GCash Reference Number (Required for GCash)
                </label>
                <div class="input-with-copy">
                    <input type="text" id="gcashReference" placeholder="Enter 13-digit GCash reference number" maxlength="13">
                    <button class="copy-btn" type="button">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <small style="color: #666; font-size: 12px;">
                    <i class="fas fa-info-circle"></i> Send payment to: <strong>0917 123 4567</strong> 
                    <span class="copy-small" style="cursor: pointer; margin-left: 5px;">
                        <i class="fas fa-copy"></i> Copy
                    </span>
                </small>
            </div>

            <div class="payment-confirm">
                <button class="btn btn-primary" id="confirmPaymentBtn" style="width: 100%;">
                    <i class="fas fa-check-circle"></i> Confirm Booking & Payment
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    currentPaymentModal = modal;
    
    // Store booking data globally for payment confirmation
    window.currentPaymentBooking = bookingData;
    
    // Add event listeners after modal is created
    setupPaymentModalEvents();
    addPaymentMethodStyles();
}

function setupPaymentModalEvents() {
    if (!currentPaymentModal) return;
    
    // Close button
    const closeBtn = currentPaymentModal.querySelector('#paymentModalClose');
    if (closeBtn) {
        closeBtn.onclick = closePaymentModal;
    }
    
    // Payment method selection
    const paymentRadios = currentPaymentModal.querySelectorAll('input[name="paymentMethod"]');
    paymentRadios.forEach(radio => {
        radio.onchange = function() {
            handlePaymentMethodChange(this);
        };
    });
    
    // Copy GCash number button
    const copyBtn = currentPaymentModal.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.onclick = copyGCashNumber;
    }
    
    const copySmall = currentPaymentModal.querySelector('.copy-small');
    if (copySmall) {
        copySmall.onclick = copyGCashNumber;
    }
    
    // Confirm payment button
    const confirmBtn = currentPaymentModal.querySelector('#confirmPaymentBtn');
    if (confirmBtn) {
        confirmBtn.onclick = function() {
            processPaymentDirectly();
        };
    }
}

function handlePaymentMethodChange(radio) {
    selectedPaymentMethod = radio.value;
    
    console.log('Payment method selected:', selectedPaymentMethod);
    
    if (window.currentPaymentBooking) {
        window.currentPaymentBooking.paymentMethod = selectedPaymentMethod;
        
        if (selectedPaymentMethod === 'cod') {
            window.currentPaymentBooking.totalCost = window.currentPaymentBooking.cost + COD_FEE;
            const codFeeItem = currentPaymentModal.querySelector('#cod-fee-item');
            if (codFeeItem) codFeeItem.classList.remove('hidden');
        } else {
            window.currentPaymentBooking.totalCost = window.currentPaymentBooking.cost;
            const codFeeItem = currentPaymentModal.querySelector('#cod-fee-item');
            if (codFeeItem) codFeeItem.classList.add('hidden');
        }
        
        const totalAmountElement = currentPaymentModal.querySelector('#total-amount');
        if (totalAmountElement) {
            totalAmountElement.textContent = window.currentPaymentBooking.totalCost.toFixed(2);
        }
    }
}

function copyGCashNumber() {
    const gcashNumber = '09171234567';
    navigator.clipboard.writeText(gcashNumber).then(() => {
        showNotification('GCash number copied to clipboard!', 'success');
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = gcashNumber;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('GCash number copied!', 'success');
    });
}

function closePaymentModal() {
    if (currentPaymentModal) {
        currentPaymentModal.remove();
        currentPaymentModal = null;
    }
    currentBookingData = null;
    selectedPaymentMethod = null;
    window.currentPaymentBooking = null;
}

function addPaymentMethodStyles() {
    if (!document.querySelector('#payment-method-styles')) {
        const styles = document.createElement('style');
        styles.id = 'payment-method-styles';
        styles.textContent = `
            .payment-methods {
                margin: 20px 0;
            }
            
            .payment-option {
                margin-bottom: 10px;
            }
            
            .payment-option input[type="radio"] {
                display: none;
            }
            
            .payment-label {
                display: flex;
                align-items: center;
                padding: 15px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                background: white;
            }
            
            .payment-label:hover {
                border-color: #007bff;
                background: #f8f9fa;
            }
            
            .payment-option input[type="radio"]:checked + .payment-label {
                border-color: #007bff;
                background: #f0f8ff;
                box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
            }
            
            .payment-icon {
                font-size: 24px;
                color: #007bff;
                margin-right: 15px;
                width: 40px;
                text-align: center;
            }
            
            .payment-info {
                flex: 1;
            }
            
            .payment-info strong {
                display: block;
                margin-bottom: 4px;
            }
            
            .payment-info small {
                color: #666;
            }
            
            .input-with-copy {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            
            .input-with-copy input {
                flex: 1;
            }
            
            .copy-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            
            .copy-btn:hover {
                background: #0056b3;
            }
            
            .copy-small {
                color: #007bff;
                text-decoration: underline;
            }
            
            .copy-small:hover {
                color: #0056b3;
            }
        `;
        document.head.appendChild(styles);
    }
}

async function processPaymentDirectly() {
    console.log('🚀 Starting payment processing...');
    
    if (!window.currentPaymentBooking) {
        showNotification("No booking data found", 'error');
        return;
    }

    if (!currentPaymentModal) {
        showNotification("Payment modal not found", 'error');
        return;
    }

    console.log('🔍 Getting values from current payment modal...');
    
    // Get values directly from the stored modal reference
    const recipientNameInput = currentPaymentModal.querySelector('#recipientName');
    const recipientPhoneInput = currentPaymentModal.querySelector('#recipientPhone');
    const gcashReferenceInput = currentPaymentModal.querySelector('#gcashReference');
    
    console.log('📝 Recipient input:', recipientNameInput);
    console.log('📞 Phone input:', recipientPhoneInput);
    console.log('📱 GCash input:', gcashReferenceInput);

    const recipientName = recipientNameInput ? recipientNameInput.value.trim() : '';
    const recipientPhone = recipientPhoneInput ? recipientPhoneInput.value.trim() : '';
    
    console.log('📝 Recipient value:', recipientName);
    console.log('📞 Phone value:', recipientPhone);
    console.log('💳 Payment method:', window.currentPaymentBooking.paymentMethod);

    // Validate recipient name
    if (!recipientName) {
        showNotification("Please enter recipient name", 'error');
        if (recipientNameInput) recipientNameInput.focus();
        return;
    }

    const paymentMethod = window.currentPaymentBooking.paymentMethod;
    
    if (!paymentMethod) {
        showNotification("Please select a payment method", 'error');
        return;
    }

    // For GCash, validate reference number
    if (paymentMethod === 'gcash') {
        const gcashReference = gcashReferenceInput ? gcashReferenceInput.value.trim() : '';
        console.log('📱 GCash reference:', gcashReference);
        if (!gcashReference) {
            showNotification("Please enter GCash reference number", 'error');
            if (gcashReferenceInput) gcashReferenceInput.focus();
            return;
        }
        if (gcashReference.length !== 13) {
            showNotification("GCash reference number must be 13 digits", 'error');
            if (gcashReferenceInput) gcashReferenceInput.focus();
            return;
        }
        window.currentPaymentBooking.gcashReference = gcashReference;
    }

    // Add recipient info to booking data
    window.currentPaymentBooking.recipientName = recipientName;
    window.currentPaymentBooking.recipientPhone = recipientPhone || '';

    try {
        showLoadingState(true);
        
        const user = firebase.auth().currentUser;
        if (!user) {
            showNotification('Please log in to complete booking', 'error');
            closePaymentModal();
            return;
        }
        
        console.log('👤 User:', user.email);
        
        // Prepare shipment data
        const shipmentData = {
            ...window.currentPaymentBooking.quote,
            recipientName: window.currentPaymentBooking.recipientName,
            recipientPhone: window.currentPaymentBooking.recipientPhone || '',
            paymentMethod: window.currentPaymentBooking.paymentMethod,
            paymentStatus: window.currentPaymentBooking.paymentMethod === 'cod' ? 'pending' : 'paid',
            gcashReference: window.currentPaymentBooking.paymentMethod === 'gcash' ? window.currentPaymentBooking.gcashReference : '',
            status: 'booked',
            createdAt: new Date().toISOString(),
            userId: user.uid,
            userEmail: user.email
        };
        
        // Calculate total amount
        const shippingAmount = window.currentPaymentBooking.cost || 0;
        const codFee = window.currentPaymentBooking.paymentMethod === 'cod' ? COD_FEE : 0;
        const totalCost = shippingAmount + codFee;
        
        console.log('💰 Total cost:', totalCost);
        console.log('📤 Creating shipment...');
        
        // Create shipment
        const trackingNumber = await createShipment(shipmentData, window.currentPaymentBooking.paymentMethod, totalCost);
        
        console.log('✅ Shipment created:', trackingNumber);
        
        // Show success message
        let successMessage = '';
        
        if (window.currentPaymentBooking.paymentMethod === 'cod') {
            successMessage = `Shipment booked successfully! 
            
Tracking Number: ${trackingNumber}
Recipient: ${window.currentPaymentBooking.recipientName}
${window.currentPaymentBooking.recipientPhone ? `Recipient Phone: ${window.currentPaymentBooking.recipientPhone}\n` : ''}
Total Amount: ₱${totalCost.toFixed(2)}
Payment Method: Cash on Delivery

Payment will be collected upon delivery. You can track your shipment using the tracking number above.`;
        } else if (window.currentPaymentBooking.paymentMethod === 'gcash') {
            successMessage = `Payment submitted successfully! 
            
Tracking Number: ${trackingNumber}
Recipient: ${window.currentPaymentBooking.recipientName}
${window.currentPaymentBooking.recipientPhone ? `Recipient Phone: ${window.currentPaymentBooking.recipientPhone}\n` : ''}
Amount Paid: ₱${window.currentPaymentBooking.cost.toFixed(2)}
Reference: ${window.currentPaymentBooking.gcashReference}

Your payment is being verified. We'll process your shipment once confirmed.`;
        }
        
        showNotification(successMessage, 'success');
        
        // Clear form and reset
        const quoteForm = document.getElementById("quoteForm");
        const quoteOutput = document.getElementById("quoteOutput");
        const trackCode = document.getElementById("trackCode");
        
        if (quoteForm) quoteForm.reset();
        if (quoteOutput) quoteOutput.classList.add('hidden');
        if (trackCode) trackCode.value = trackingNumber;
        
        // Close payment modal
        closePaymentModal();
        
        window.currentPaymentBooking = null;
        currentBooking = null;
        
        // Scroll to tracking section
        window.location.hash = "#track";
        
    } catch (error) {
        console.error('❌ Payment error:', error);
        showNotification("Error processing payment. Please try again.", 'error');
    } finally {
        showLoadingState(false);
    }
}

// ==================== DASHBOARD SYSTEM ====================

async function showDashboard() {
    const user = auth.currentUser;
    if (!user) {
        openLogin();
        return;
    }
  
    try {
        showLoadingState(true, 'dashboard');
        
        const [shipments, userData] = await Promise.all([
            getUserShipments(),
            getUserData()
        ]);
  
        const modal = document.createElement('div');
        modal.className = 'modal-wrap';
        modal.innerHTML = `
            <div class="modal-card dashboard-modal" style="max-width: 1000px; max-height: 90vh; display: flex; flex-direction: column;">
                <button class="modal-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="dashboard-header" style="flex-shrink: 0;">
                    <h3>Welcome back, ${userData?.name || 'Customer'}!</h3>
                    <div class="user-info">
                        <span class="user-email">${userData?.email || user.email}</span>
                        ${user.emailVerified ? 
                            '<span class="verification-badge verified"><i class="fas fa-check-circle"></i> Verified</span>' : 
                            '<span class="verification-badge unverified"><i class="fas fa-exclamation-triangle"></i> Unverified</span>'
                        }
                    </div>
                </div>
                
                <div class="dashboard-stats" style="flex-shrink: 0;">
                    <div class="stat-card">
                        <div class="stat-number">${shipments.length}</div>
                        <div class="stat-label">Total Shipments</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${shipments.filter(s => s.status === 'delivered').length}</div>
                        <div class="stat-label">Delivered</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length}</div>
                        <div class="stat-label">In Transit</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">₱${shipments.reduce((sum, s) => sum + (s.totalCost || s.cost || 0), 0).toFixed(0)}</div>
                        <div class="stat-label">Total Spent</div>
                    </div>
                </div>
                
                <div class="dashboard-actions" style="flex-shrink: 0;">
                    <button class="btn btn-primary" onclick="location.hash='#quote'; this.closest('.modal-wrap').remove()">
                        <i class="fas fa-plus"></i> New Shipment
                    </button>
                    <button class="btn btn-outline" onclick="location.hash='#track'; this.closest('.modal-wrap').remove()">
                        <i class="fas fa-search"></i> Track Shipment
                    </button>
                    ${!user.emailVerified ? `
                        <button class="btn btn-warning" onclick="sendVerificationEmail()">
                            <i class="fas fa-envelope"></i> Verify Email
                        </button>
                    ` : ''}
                </div>
                
                <div class="user-bookings" style="flex: 1; overflow-y: auto; min-height: 0;">
                    <h4>Your Shipments & Tracking Numbers</h4>
                    ${shipments.length === 0 ? 
                        '<div class="empty-state">' +
                            '<i class="fas fa-box-open" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>' +
                            '<p class="muted">No shipments yet.</p>' +
                            '<button class="btn btn-primary" onclick="location.hash=\'#quote\'; this.closest(\'.modal-wrap\').remove()">Create Your First Shipment</button>' +
                        '</div>' :
                        shipments.map(shipment => `
                            <div class="booking-card" onclick="trackShipmentFromDashboard('${shipment.trackingNumber}')">
                                <div class="booking-header">
                                    <div class="booking-tracking">
                                        <strong class="tracking-number">${shipment.trackingNumber}</strong>
                                        <span class="booking-date">${new Date(shipment.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span class="status-badge status-${shipment.status}">${formatStatus(shipment.status)}</span>
                                </div>
                                
                                <div class="booking-route">
                                    <div class="route-point">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span class="route-location">${shipment.origin}</span>
                                    </div>
                                    <div class="route-arrow">
                                        <i class="fas fa-arrow-right"></i>
                                    </div>
                                    <div class="route-point">
                                        <i class="fas fa-location-dot"></i>
                                        <span class="route-location">${shipment.destination}</span>
                                    </div>
                                </div>
                                
                                <div class="booking-details">
                                    <div class="detail-item">
                                        <i class="fas fa-${getShippingModeIcon(shipment.shippingMode)}"></i>
                                        <span>${shipment.serviceName || formatStatus(shipment.shippingMode)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <i class="fas fa-weight-hanging"></i>
                                        <span>${shipment.packageDetails.weight} kg</span>
                                    </div>
                                    <div class="detail-item">
                                        <i class="fas fa-money-bill-wave"></i>
                                        <span>₱${(shipment.totalCost || shipment.cost || 0).toFixed(2)}</span>
                                    </div>
                                    <div class="detail-item">
                                        <i class="fas fa-wallet"></i>
                                        <span>${formatStatus(shipment.paymentMethod)}</span>
                                    </div>
                                </div>
                                
                                <div class="booking-actions">
                                    <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); trackShipmentFromDashboard('${shipment.trackingNumber}')">
                                        <i class="fas fa-eye"></i> Track
                                    </button>
                                    <button class="btn btn-small btn-outline" onclick="event.stopPropagation(); copyTrackingNumber('${shipment.trackingNumber}')">
                                        <i class="fas fa-copy"></i> Copy Tracking
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add responsive styles for the dashboard modal
        addDashboardStyles();
        
    } catch (error) {
        console.error('Dashboard error:', error);
        showNotification("Error loading dashboard. Please try again.", 'error');
    } finally {
        showLoadingState(false, 'dashboard');
    }
  }
  
  function addDashboardStyles() {
      if (!document.querySelector('#dashboard-styles')) {
          const styles = document.createElement('style');
          styles.id = 'dashboard-styles';
          styles.textContent = `
              /* Dashboard Modal Responsive Styles */
              .dashboard-modal {
                  display: flex !important;
                  flex-direction: column !important;
                  max-height: 90vh !important;
                  width: 95% !important;
                  max-width: 1000px !important;
                  margin: 20px auto !important;
              }
              
              /* Mobile First Styles */
              @media (max-width: 768px) {
                  .dashboard-modal {
                      width: 98% !important;
                      max-height: 85vh !important;
                      margin: 10px auto !important;
                      border-radius: 12px !important;
                  }
                  
                  .dashboard-stats {
                      grid-template-columns: repeat(2, 1fr) !important;
                      gap: 10px !important;
                      margin-bottom: 15px !important;
                  }
                  
                  .stat-card {
                      padding: 1rem !important;
                  }
                  
                  .stat-number {
                      font-size: 1.5rem !important;
                  }
                  
                  .dashboard-actions {
                      flex-direction: column !important;
                      gap: 10px !important;
                      margin-bottom: 15px !important;
                  }
                  
                  .dashboard-actions .btn {
                      width: 100% !important;
                      margin: 0 !important;
                  }
                  
                  .user-bookings {
                      max-height: 50vh !important;
                      padding-right: 5px !important;
                  }
                  
                  .booking-card {
                      padding: 12px !important;
                      margin-bottom: 12px !important;
                  }
                  
                  .booking-header {
                      flex-direction: column !important;
                      align-items: flex-start !important;
                      gap: 8px !important;
                  }
                  
                  .booking-tracking {
                      flex-direction: column !important;
                      align-items: flex-start !important;
                      gap: 4px !important;
                  }
                  
                  .booking-route {
                      flex-direction: column !important;
                      gap: 8px !important;
                      margin-bottom: 10px !important;
                  }
                  
                  .route-arrow {
                      transform: rotate(90deg) !important;
                      margin: 5px 0 !important;
                  }
                  
                  .booking-details {
                      grid-template-columns: repeat(2, 1fr) !important;
                      gap: 8px !important;
                  }
                  
                  .booking-actions {
                      flex-direction: column !important;
                      gap: 8px !important;
                  }
                  
                  .booking-actions .btn {
                      width: 100% !important;
                      margin: 0 !important;
                  }
              }
              
              /* Tablet Styles */
              @media (min-width: 769px) and (max-width: 1024px) {
                  .dashboard-modal {
                      width: 90% !important;
                      max-height: 85vh !important;
                  }
                  
                  .dashboard-stats {
                      grid-template-columns: repeat(4, 1fr) !important;
                      gap: 15px !important;
                  }
                  
                  .user-bookings {
                      max-height: 55vh !important;
                  }
                  
                  .booking-details {
                      grid-template-columns: repeat(4, 1fr) !important;
                      gap: 12px !important;
                  }
              }
              
              /* Desktop Styles */
              @media (min-width: 1025px) {
                  .dashboard-modal {
                      width: 95% !important;
                      max-height: 80vh !important;
                  }
                  
                  .user-bookings {
                      max-height: 60vh !important;
                  }
              }
              
              /* Scrollbar Styling */
              .user-bookings::-webkit-scrollbar {
                  width: 6px;
              }
              
              .user-bookings::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 3px;
              }
              
              .user-bookings::-webkit-scrollbar-thumb {
                  background: #c1c1c1;
                  border-radius: 3px;
              }
              
              .user-bookings::-webkit-scrollbar-thumb:hover {
                  background: #a8a8a8;
              }
              
              /* Ensure modal backdrop covers entire screen */
              .modal-wrap {
                  position: fixed;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: rgba(0, 0, 0, 0.5);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 1000;
                  padding: 20px;
                  overflow: auto;
              }
              
              /* Booking cards grid for better mobile layout */
              .booking-details {
                  display: grid;
                  gap: 10px;
                  margin-top: 10px;
              }
              
              .detail-item {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  font-size: 0.875rem;
                  color: #475569;
              }
              
              /* Touch-friendly buttons for mobile */
              .booking-actions .btn {
                  min-height: 36px;
                  padding: 8px 12px;
              }
              
              /* Ensure text is readable on small screens */
              .tracking-number {
                  font-size: 0.9rem;
                  word-break: break-all;
              }
              
              .route-location {
                  font-size: 0.875rem;
                  word-break: break-word;
              }
          `;
          document.head.appendChild(styles);
      }
  }

async function getUserData() {
    const user = auth.currentUser;
    if (!user) return null;
    
    try {
        const snapshot = await database.ref('users/' + user.uid).once('value');
        return snapshot.val();
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

async function getUserShipments() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const snapshot = await database.ref('userShipments/' + user.uid).once('value');
        if (snapshot.exists()) {
            const shipmentIds = Object.keys(snapshot.val());
            const shipments = [];
            
            for (const trackingNumber of shipmentIds) {
                const shipmentSnapshot = await database.ref('shipments/' + trackingNumber).once('value');
                if (shipmentSnapshot.exists()) {
                    shipments.push(shipmentSnapshot.val());
                }
            }
            
            return shipments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        return [];
    } catch (error) {
        console.error("Error getting user shipments:", error);
        return [];
    }
}

// ==================== UTILITY FUNCTIONS ====================

function getFirebaseErrorMessage(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/user-not-found': 'No account found with this email. Please sign up first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
        'auth/requires-recent-login': 'Please log in again to complete this action.'
    };
    
    return errorMessages[error.code] || `Error: ${error.message}`;
}

function showNotification(message, type = 'info', duration = 5000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
      <div class="notification-content">
          <i class="fas fa-${getNotificationIcon(type)}"></i>
          <span>${message}</span>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">
          <i class="fas fa-times"></i>
      </button>
  `;
  
  if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
          .notification {
              position: fixed;
              top: 20px;
              right: 20px;
              background: white;
              padding: 1rem 1.5rem;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              border-left: 4px solid #6c63ff;
              z-index: 10000;
              display: flex;
              align-items: center;
              gap: 1rem;
              max-width: 400px;
              animation: slideIn 0.3s ease;
          }
          .notification-success { border-left-color: #10b981; }
          .notification-error { border-left-color: #ef4444; }
          .notification-warning { border-left-color: #f59e0b; }
          .notification-info { border-left-color: #3b82f6; }
          .notification-content { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
          .notification-close { background: none; border: none; cursor: pointer; color: #64748b; }
          @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
          }
      `;
      document.head.appendChild(styles);
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
      if (notification.parentElement) {
          notification.remove();
      }
  }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getShippingModeIcon(mode) {
    const icons = {
        air: 'plane',
        land: 'truck',
        sea: 'ship',
        bulk: 'pallet',
        courier: 'motorcycle'
    };
    return icons[mode] || 'box';
}

function formatStatus(status) {
    return (status || '').split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidTrackingNumber(code) {
    const trackingRegex = /^SS-\d{4}-\d{4}$/;
    return trackingRegex.test(code);
}

function showLoadingState(show, context = 'global') {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        if (show) {
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    });
}

function trackShipmentFromDashboard(trackingNumber) {
    const trackCode = document.getElementById('trackCode');
    if (trackCode) {
        trackCode.value = trackingNumber;
        trackShipment();
    }
    window.location.hash = "#track";
    
    const modal = document.querySelector('.modal-wrap');
    if (modal) modal.remove();
}

async function sendVerificationEmail() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await user.sendEmailVerification();
        showNotification("Verification email sent! Please check your inbox and spam folder.", 'success');
    } catch (error) {
        console.error('Verification email error:', error);
        showNotification("Error sending verification email. Please try again.", 'error');
    }
}

function copyTrackingNumber(trackingNumber) {
  navigator.clipboard.writeText(trackingNumber).then(() => {
      showNotification('Tracking number copied to clipboard!', 'success');
  }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = trackingNumber;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('Tracking number copied!', 'success');
  });
}

function shareTracking(trackingNumber) {
  const shareText = `Track my ShipSmart shipment: ${trackingNumber}\n\nYou can track it at: ${window.location.href.split('#')[0]}#track`;
  
  if (navigator.share) {
      navigator.share({
          title: 'ShipSmart Tracking',
          text: shareText,
          url: window.location.href
      }).catch(error => {
          console.log('Share cancelled:', error);
      });
  } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
          showNotification('Tracking link copied to clipboard!', 'success');
      });
  } else {
      copyTrackingNumber(trackingNumber);
  }
}

function updateUserStatsInUI(userData) {
    console.log('User stats updated:', userData?.stats);
}

// ==================== ENHANCED STYLES ====================

function addEnhancedStyles() {
    if (!document.querySelector('#enhanced-styles')) {
        const styles = document.createElement('style');
        styles.id = 'enhanced-styles';
        styles.textContent = `
            .hidden { display: none !important; }
            .loading { opacity: 0.6; pointer-events: none; }
            .error { color: #ef4444; }
            .success { color: #10b981; }
            
            .tracking-header { 
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                margin-bottom: 1rem; 
                flex-wrap: wrap;
                gap: 1rem;
            }
            .tracking-number { 
                background: #f1f5f9; 
                padding: 0.5rem 1rem; 
                border-radius: 6px; 
                font-family: monospace;
                font-weight: 600;
                color: #475569;
            }
            .status-description { 
                background: #f8fafc; 
                padding: 1rem;
                border-radius: 8px; 
                margin: 1rem 0; 
                border-left: 4px solid #3b82f6;
            }
            .status-description .small {
                font-size: 0.875rem;
                margin-top: 0.5rem;
            }
            .tracking-details { 
                margin-top: 1.5rem; 
                background: #f8fafc;
                padding: 1rem;
                border-radius: 8px;
            }
            .detail-row { 
                display: flex; 
                justify-content: space-between; 
                padding: 0.75rem 0; 
                border-bottom: 1px solid #e2e8f0; 
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: 600;
                color: #475569;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .detail-value {
                color: #1e293b;
                font-weight: 500;
            }
            .delivered-row {
                background: #d1fae5;
                margin: 0 -1rem;
                padding: 1rem;
                border-radius: 6px;
            }
            .tracking-actions {
                margin-top: 1.5rem;
                padding-top: 1rem;
                border-top: 1px solid #e2e8f0;
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .breakdown-item { 
                display: flex; 
                justify-content: space-between; 
                padding: 0.75rem 0; 
                border-bottom: 1px solid rgba(6, 182, 212, 0.2); 
            }
            .breakdown-item:last-child {
                border-bottom: none;
            }
            .total-breakdown {
                border-top: 2px solid #06b6d4;
                margin-top: 0.5rem;
                padding-top: 1rem;
                font-weight: 600;
                font-size: 1.1em;
            }
            
            .dashboard-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            }
            .stat-card {
                background: white;
                padding: 1.5rem;
                border-radius: 12px;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border: 1px solid #e2e8f0;
            }
            .stat-number {
                font-size: 2rem;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 0.5rem;
            }
            .stat-label {
                color: #64748b;
                font-size: 0.875rem;
                font-weight: 500;
            }
            .dashboard-actions {
                display: flex;
                gap: 1rem;
                margin-bottom: 2rem;
                flex-wrap: wrap;
            }
            .recent-shipments {
                margin-top: 2rem;
            }
            .shipment-item {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
                background: #f8fafc;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .shipment-item:hover {
                border-color: #3b82f6;
                box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
            }
            .shipment-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.5rem;
                flex-wrap: wrap;
                gap: 0.5rem;
            }
            .shipment-date {
                font-size: 0.875rem;
                color: #64748b;
                margin-left: 0.5rem;
            }
            .status-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            .status-booked { background: #fef3c7; color: #92400e; }
            .status-pending_payment { background: #fee2e2; color: #991b1b; }
            .status-in_transit { background: #e0e7ff; color: #3730a3; }
            .status-delivered { background: #d1fae5; color: #065f46; }
            .shipment-route {
                color: #475569;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            .shipment-details {
                display: flex;
                gap: 1rem;
                margin-top: 0.5rem;
                flex-wrap: wrap;
            }
            .detail {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.875rem;
                color: #475569;
            }
            .empty-state {
                text-align: center;
                padding: 3rem 2rem;
                background: #f8fafc;
                border-radius: 12px;
                border: 2px dashed #cbd5e1;
            }
            
            .progress-container {
                margin: 1.5rem 0;
            }
            .progress-bar {
                height: 8px;
                background: #e2e8f0;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }
            .progress-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.5s ease;
            }
            .progress-label {
                text-align: center;
                font-size: 0.875rem;
                color: #64748b;
                font-weight: 500;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-top: 0.5rem;
                flex-wrap: wrap;
            }
            .user-email {
                color: #64748b;
                font-size: 0.9rem;
            }
            .verification-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
            .verification-badge.verified {
                background: #d1fae5;
                color: #065f46;
            }
            .verification-badge.unverified {
                background: #fef3c7;
                color: #92400e;
            }
            
            .form-message {
                margin-top: 1rem;
                padding: 0.75rem;
                border-radius: 8px;
                text-align: center;
                font-weight: 500;
            }
            .form-message.success {
                background: rgba(16, 185, 129, 0.1);
                color: #065f46;
                border: 1px solid rgba(16, 185, 129, 0.2);
            }
            .form-message.error {
                background: rgba(239, 68, 68, 0.1);
                color: #7f1d1d;
                border: 1px solid rgba(239, 68, 68, 0.2);
            }
        `;
        document.head.appendChild(styles);
    }
}

// ==================== EVENT LISTENER SETUP ====================

function setupEventListeners() {
  console.log('Setting up comprehensive event listeners...');
  
  const bookNowHero = document.getElementById("bookNowHero");
  const bookNowTop = document.getElementById("bookNowTop");
  const loginBtn = document.getElementById("loginBtn");
  
  if (bookNowHero) {
    bookNowHero.addEventListener("click", function(e) {
        e.preventDefault();
        handleBookNowClick();
    });
    console.log('Book Now Hero listener added');
} else {
    console.error('Book Now Hero button not found');
}

if (bookNowTop) {
    bookNowTop.addEventListener("click", function(e) {
        e.preventDefault();
        handleBookNowClick();
    });
    console.log('Book Now Top listener added');
} else {
    console.error('Book Now Top button not found');
}

if (loginBtn) {
    loginBtn.addEventListener("click", function(e) {
        e.preventDefault();
        openLogin();
    });
    console.log('Login button listener added');
} else {
    console.error('Login button not found');
}

  const modalClose = document.getElementById("modalClose");
  const doLogin = document.getElementById("doLogin");
  const goRegister = document.getElementById("goRegister");
  const proceedBooking = document.getElementById("proceedBooking");

  if (modalClose) {
      modalClose.addEventListener("click", closeLogin);
      console.log('Modal close listener added');
  }
  if (doLogin) {
      doLogin.addEventListener("click", doLoginAction);
      console.log('Do Login listener added');
  }
  if (goRegister) {
      goRegister.addEventListener("click", openSignUp);
      console.log('Go Register listener added');
  }
  if (proceedBooking) {
      proceedBooking.addEventListener("click", proceedToBooking);
      console.log('Proceed Booking listener added');
  }

  const trackButton = document.querySelector('button[onclick="trackShipment()"]');
  if (trackButton) {
      trackButton.addEventListener('click', trackShipment);
      console.log('Track button listener added');
  }

  const trackInput = document.getElementById("trackCode");
  if (trackInput) {
      trackInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              trackShipment();
          }
      });
      console.log('Track input enter key listener added');
  }

  const quoteForm = document.getElementById("quoteForm");
  if (quoteForm) {
      quoteForm.addEventListener('submit', function(e) {
          e.preventDefault();
          computeQuote();
      });
      console.log('Quote form submit listener added');
  }

  const signupButton = document.querySelector('button[onclick="signupUser()"]');
  if (signupButton) {
      signupButton.addEventListener('click', signupUser);
      console.log('Signup button listener added');
  }

  console.log('All event listeners setup complete');
}

function handleBookNowClick() {
  const user = auth.currentUser;
  
  if (user) {
      console.log('User logged in, redirecting to quote section');
      window.location.hash = "#quote";
      showNotification("Welcome back! Let's create your shipment.", 'success');
      
      setTimeout(() => {
          const quoteSection = document.getElementById('quote');
          if (quoteSection) {
              quoteSection.scrollIntoView({ behavior: 'smooth' });
          }
      }, 100);
  } else {
      console.log('User not logged in, opening login modal');
      openLogin();
  }
}

// ==================== TRACKING EVENT LISTENERS ====================

function setupTrackingEventListeners() {
  const trackInput = document.getElementById("trackCode");
  const trackButton = document.querySelector('button[onclick="trackShipment()"]');
  
  if (trackInput) {
    trackInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            trackShipment();
        }
    });
    
    // Auto-focus on tracking input when section is visited
    if (window.location.hash === '#track') {
        setTimeout(() => {
            trackInput.focus();
        }, 300);
    }
  }
  
  if (trackButton) {
    // Remove existing onclick and use event listener for better control
    trackButton.onclick = null;
    trackButton.addEventListener('click', trackShipment);
  }
}

// ==================== DASHBOARD AND ADMIN BUTTONS ====================

function addDashboardButton() {
  if (document.getElementById('dashboardBtn')) {
    const existingBtn = document.getElementById('dashboardBtn');
    existingBtn.onclick = showDashboard;
    console.log('Dashboard button event handler attached');
    return;
  }
  
  const dashboardBtn = document.createElement('button');
  dashboardBtn.id = 'dashboardBtn';
  dashboardBtn.className = 'btn btn-outline hidden';
  dashboardBtn.innerHTML = '<i class="fas fa-tachometer-alt"></i> My Shipments';
  dashboardBtn.onclick = showDashboard;
  
  const mainNav = document.querySelector('.main-nav');
  if (mainNav) {
      const loginBtn = mainNav.querySelector('#loginBtn');
      if (loginBtn) {
          mainNav.insertBefore(dashboardBtn, loginBtn);
          console.log('Dashboard button added to navigation');
      } else {
          mainNav.appendChild(dashboardBtn);
          console.log('Dashboard button appended to navigation');
      }
  } else {
      console.error('Main navigation not found');
  }
}

function addAdminPanelButton() {
  if (document.getElementById('adminPanelBtn')) return;
  
  const adminPanelBtn = document.createElement('button');
  adminPanelBtn.id = 'adminPanelBtn';
  adminPanelBtn.className = 'btn btn-warning hidden';
  adminPanelBtn.innerHTML = '<i class="fas fa-user-shield"></i> Admin Panel';
  adminPanelBtn.onclick = function() {
      console.log('Admin panel button clicked - navigating to admin.html');
      window.location.href = 'admin.html';
  };
  
  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
      navActions.insertBefore(adminPanelBtn, navActions.firstChild);
      console.log('Admin panel button added to navigation (prominent position)');
  }
}

function setupRememberMe() {
    const rememberMe = localStorage.getItem('shipsmart_rememberme');
    const savedEmail = localStorage.getItem('shipsmart_user_email');
    
    if (rememberMe === 'true' && savedEmail && !auth.currentUser) {
        const emailInput = document.getElementById("li_email");
        if (emailInput) {
            emailInput.value = savedEmail;
        }
        
        setTimeout(() => {
            if (!auth.currentUser) {
                openLogin();
            }
        }, 1000);
    }
}

// ==================== INITIALIZATION ====================

document.addEventListener("DOMContentLoaded", function() {
    console.log('DOM fully loaded - initializing ShipSmart');
    
    setupEventListeners();
    setupTrackingEventListeners();
    addDashboardButton();
    addAdminPanelButton();
    setupRememberMe();
    
    if (auth) {
        auth.onAuthStateChanged(function(user) {
            console.log('Auth state changed:', user ? `User signed in (${user.email})` : 'User signed out');
            updateAuthUI(user);
        });
    } else {
        console.warn('Firebase auth not available - running in limited mode');
    }

    addEnhancedStyles();
    
    // Auto-focus on tracking input when navigating to track section
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#track') {
            const trackInput = document.getElementById("trackCode");
            if (trackInput) {
                setTimeout(() => {
                    trackInput.focus();
                }, 300);
            }
        }
    });
    
    console.log('ShipSmart initialization complete - system ready');
});

// ==================== ADMIN PANEL FUNCTIONS ====================

if (window.location.pathname.endsWith('admin.html')) {
    document.addEventListener('DOMContentLoaded', setupAdminPage);
}

function fetchShipmentsForAdmin() {
  console.log('Fetching shipments for admin...');
  database.ref('shipments').once('value').then(snapshot => {
      const shipments = [];
      snapshot.forEach(childSnapshot => {
          const shipment = childSnapshot.val();
          shipment.key = childSnapshot.key;
          shipments.push(shipment);
      });
      
      if (typeof updateAdminTable === 'function') {
          updateAdminTable(shipments);
      }
  }).catch(error => {
      console.error('Error fetching shipments for admin:', error);
  });
}

function setupAdminPage() {
  console.log('Setting up admin page...');
  fetchShipmentsForAdmin();
}

console.log('ShipSmart script loaded successfully - Complete Enhanced Version');