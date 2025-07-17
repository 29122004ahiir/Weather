document.addEventListener('DOMContentLoaded', function() {
            // DOM Elements
            const searchInput = document.getElementById('search-input');
            const searchBtn = document.getElementById('search-btn');
            const celsiusBtn = document.getElementById('celsius-btn');
            const fahrenheitBtn = document.getElementById('fahrenheit-btn');
            const currentWeather = document.getElementById('current-weather');
            const forecast = document.getElementById('forecast');
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            const recentSearches = document.getElementById('recent-searches');
            const recentList = document.getElementById('recent-list');
            
            // State
            let unit = 'metric'; // Default to Celsius
            let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
            
            // API Key (Note: In a real app, this should be secured)
            const API_KEY = 'dd60c0325a81666c7217ebe1109a71c0'; // Replace with your actual API key
            
            // Initialize
            updateRecentSearches();
            
            // Event Listeners
            searchBtn.addEventListener('click', fetchWeather);
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    fetchWeather();
                }
            });
            
            celsiusBtn.addEventListener('click', function() {
                if (unit !== 'metric') {
                    unit = 'metric';
                    celsiusBtn.classList.add('active');
                    fahrenheitBtn.classList.remove('active');
                    if (currentWeather.classList.contains('hidden')) return;
                    fetchWeather(searchInput.value || 'London'); // Default to London if empty
                }
            });
            
            fahrenheitBtn.addEventListener('click', function() {
                if (unit !== 'imperial') {
                    unit = 'imperial';
                    fahrenheitBtn.classList.add('active');
                    celsiusBtn.classList.remove('active');
                    if (currentWeather.classList.contains('hidden')) return;
                    fetchWeather(searchInput.value || 'London'); // Default to London if empty
                }
            });
            
            // Functions
            async function fetchWeather(city = null) {
                const cityName = city || searchInput.value.trim();
                
                if (!cityName) {
                    showError('Please enter a city name');
                    return;
                }
                
                // Show loading state
                loading.classList.remove('hidden');
                currentWeather.classList.add('hidden');
                forecast.innerHTML = '';
                error.classList.add('hidden');
                
                try {
                    // Fetch current weather
                    const currentResponse = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=${unit}&appid=${API_KEY}`
                    );
                    
                    if (!currentResponse.ok) {
                        throw new Error('City not found');
                    }
                    
                    const currentData = await currentResponse.json();
                    
                    // Fetch forecast
                    const forecastResponse = await fetch(
                        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=${unit}&appid=${API_KEY}`
                    );
                    
                    if (!forecastResponse.ok) {
                        throw new Error('Forecast data not available');
                    }
                    
                    const forecastData = await forecastResponse.json();
                    
                    // Update UI
                    displayCurrentWeather(currentData);
                    displayForecast(forecastData);
                    
                    // Add to recent searches
                    addToRecentSearches(currentData.name, currentData.sys.country);
                    
                    // Hide loading and show content
                    loading.classList.add('hidden');
                    currentWeather.classList.remove('hidden');
                    recentSearches.classList.remove('hidden');
                    
                } catch (err) {
                    console.error('Error fetching weather data:', err);
                    loading.classList.add('hidden');
                    showError(err.message);
                }
            }
            
            function displayCurrentWeather(data) {
                document.getElementById('location').textContent = data.name;
                document.getElementById('country').textContent = data.sys.country;
                
                const temp = Math.round(data.main.temp);
                document.getElementById('current-temp').textContent = temp;
                document.getElementById('temp-unit').textContent = unit === 'metric' ? 'C' : 'F';
                
                document.getElementById('current-desc').textContent = data.weather[0].description;
                
                const windSpeed = unit === 'metric' 
                    ? `${Math.round(data.wind.speed * 3.6)} km/h` 
                    : `${Math.round(data.wind.speed)} mph`;
                document.getElementById('wind-speed').textContent = windSpeed;
                
                document.getElementById('humidity').textContent = `${data.main.humidity}%`;
                
                const feelsLike = Math.round(data.main.feels_like);
                document.getElementById('feels-like').textContent = `${feelsLike}°${unit === 'metric' ? 'C' : 'F'}`;
                
                const visibility = unit === 'metric' 
                    ? `${data.visibility / 1000} km` 
                    : `${Math.round(data.visibility / 1609)} miles`;
                document.getElementById('visibility').textContent = visibility;
                
                // Set weather icon
                const iconCode = data.weather[0].icon;
                const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
                const iconElement = document.getElementById('current-icon');
                iconElement.innerHTML = `<img src="${iconUrl}" alt="${data.weather[0].description}" class="w-full h-full">`;
            }
            
            function displayForecast(data) {
                // Filter to get one forecast per day (every 24 hours)
                const dailyForecasts = [];
                const days = {};
                
                data.list.forEach(item => {
                    const date = new Date(item.dt * 1000);
                    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    if (!days[day]) {
                        days[day] = true;
                        dailyForecasts.push(item);
                    }
                });
                
                // Display forecast cards
                forecast.innerHTML = dailyForecasts.slice(0, 5).map(item => {
                    const date = new Date(item.dt * 1000);
                    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const temp = Math.round(item.main.temp);
                    const iconCode = item.weather[0].icon;
                    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
                    
                    return `
                        <div class="weather-card bg-white rounded-xl shadow-md p-4 text-center transition-all duration-300 hover:bg-blue-50">
                            <h4 class="font-semibold text-gray-700 mb-2">${day}</h4>
                            <div class="flex justify-center mb-3">
                                <img src="${iconUrl}" alt="${item.weather[0].description}" class="weather-icon w-12 h-12">
                            </div>
                            <div class="flex justify-center gap-4">
                                <div>
                                    <p class="text-sm text-gray-500">High</p>
                                    <p class="font-bold">${Math.round(item.main.temp_max)}°</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">Low</p>
                                    <p class="font-bold">${Math.round(item.main.temp_min)}°</p>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            function showError(message) {
                document.getElementById('error-message').textContent = message;
                error.classList.remove('hidden');
            }
            
            function addToRecentSearches(city, country) {
                // Check if already exists
                const exists = recentCities.some(item => item.city === city && item.country === country);
                
                if (!exists) {
                    recentCities.unshift({ city, country });
                    
                    // Keep only the last 5 searches
                    if (recentCities.length > 5) {
                        recentCities.pop();
                    }
                    
                    localStorage.setItem('recentCities', JSON.stringify(recentCities));
                    updateRecentSearches();
                }
            }
            
            function updateRecentSearches() {
                if (recentCities.length === 0) {
                    recentSearches.classList.add('hidden');
                    return;
                }
                
                recentList.innerHTML = recentCities.map(item => {
                    return `
                        <button 
                            onclick="fetchRecentSearch('${item.city}', '${item.country}')"
                            class="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm transition-colors duration-200"
                        >
                            ${item.city}, ${item.country}
                        </button>
                    `;
                }).join('');
                
                recentSearches.classList.remove('hidden');
            }
            
            // Make fetchRecentSearch available globally
            window.fetchRecentSearch = function(city, country) {
                searchInput.value = city;
                fetchWeather(city);
            };
            
            // Fetch default weather on load (London)
            fetchWeather('London');
        });