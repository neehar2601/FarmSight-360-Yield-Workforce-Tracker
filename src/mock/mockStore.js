/**
 * mockStore.js
 *
 * In-memory reactive state manager with LocalStorage persistence.
 * Implements full CRUD across existing schema tables and all marketplace workflows.
 */

import { INITIAL_DATA } from './initialData';

const STORAGE_KEY = 'farm360_marketplace_mock_db_v3';
const ACTIVE_ROLE_KEY = 'farm360_active_role_v3';
const CURRENT_USER_KEY = 'farm360_current_user_v3';
const LAST_SYNC_KEY = 'farm360_last_sync_v3';

// Deep clone helper
const clone = (obj) => JSON.parse(JSON.stringify(obj));

class MockStore {
    constructor() {
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('farm360_marketplace_mock_db_v1');
                localStorage.removeItem('farm360_marketplace_mock_db_v2');
                localStorage.removeItem('farm360_consumer_cart_v1');
                localStorage.removeItem('farm360_consumer_cart_v2');
            } catch (e) {
                // ignore
            }
        }

        this.listeners = new Set();
        this.state = this.loadState();
        this.activeRole = localStorage.getItem(ACTIVE_ROLE_KEY) || 'farmer'; // 'farmer' | 'consumer' | 'depot'
        const savedUser = localStorage.getItem(CURRENT_USER_KEY);
        this.currentUserId = savedUser && this.state.users?.some(u => u.id === savedUser)
            ? savedUser
            : this.getDefaultUserForRole(this.activeRole);

        // Real-Time Multi-Tab Browser Cache Synchronization:
        // When user makes an action in one tab (e.g. customer places order),
        // other open tabs (e.g. farmer app) receive the storage event and live-update immediately!
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (e) => {
                if (e.key === STORAGE_KEY && e.newValue) {
                    try {
                        this.state = JSON.parse(e.newValue);
                        this.notify();
                    } catch (err) {
                        console.warn('Cross-tab sync parse error:', err);
                    }
                } else if (e.key === ACTIVE_ROLE_KEY && e.newValue) {
                    this.activeRole = e.newValue;
                    this.notify();
                } else if (e.key === CURRENT_USER_KEY && e.newValue) {
                    this.currentUserId = e.newValue;
                    this.notify();
                }
            });
        }
    }

    getDefaultUserForRole(role) {
        if (role === 'farmer') return 'user-farmer-1';
        if (role === 'consumer') return 'user-customer-1';
        if (role === 'depot') return 'user-admin-1';
        return 'user-farmer-1';
    }

    loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Ensure all expected collections exist
                const tables = [
                    'farms', 'crops', 'activities', 'inventory', 'machinery',
                    'workers', 'expenses', 'revenue', 'crop_sales',
                    'marketplace_listings', 'hub_consignments', 'marketplace_orders',
                    'b2b_rfqs', 'users'
                ];
                for (const t of tables) {
                    if (!parsed[t]) {
                        parsed[t] = clone(INITIAL_DATA[t] || []);
                    }
                }

                // Ensure initial seed listings exist
                if (Array.isArray(INITIAL_DATA.marketplace_listings)) {
                    for (const defListing of INITIAL_DATA.marketplace_listings) {
                        if (!parsed.marketplace_listings.some(l => l.id === defListing.id)) {
                            parsed.marketplace_listings.push(clone(defListing));
                        }
                    }
                }

                return parsed;
            }
        } catch (e) {
            console.error('Failed to parse mock store from browser storage:', e);
        }
        const initial = clone(INITIAL_DATA);
        this.saveState(initial);
        return initial;
    }

    saveState(newState = this.state) {
        this.state = newState;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
            localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
        } catch (e) {
            console.error('Failed to save mock store to browser cache:', e);
        }
        this.notify();
    }

    resetToDefault() {
        const fresh = clone(INITIAL_DATA);
        this.saveState(fresh);
        console.log('🔄 Mock Store reset to fresh seed in browser cache');
        return fresh;
    }

    getLastSyncTime() {
        return localStorage.getItem(LAST_SYNC_KEY) || new Date().toISOString();
    }

    getStorageSizeKB() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? Math.round((new Blob([raw]).size) / 1024) : 0;
        } catch {
            return 0;
        }
    }

    exportDatabase() {
        return JSON.stringify(this.state, null, 2);
    }

    importDatabase(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (parsed.farms && parsed.crops && parsed.marketplace_listings) {
                this.saveState(parsed);
                return { success: true };
            }
            return { error: 'Invalid database backup structure' };
        } catch (e) {
            return { error: e.message };
        }
    }

    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    }

    notify() {
        for (const listener of this.listeners) {
            try {
                listener(this.state);
            } catch (e) {
                console.error('Mock store listener error:', e);
            }
        }
    }

    // ── ROLE & PERSONA SWITCHING ──────────────────────────────────────────────

    getActiveRole() {
        return this.activeRole;
    }

    setActiveRole(role) {
        this.activeRole = role;
        localStorage.setItem(ACTIVE_ROLE_KEY, role);
        this.currentUserId = this.getDefaultUserForRole(role);
        localStorage.setItem(CURRENT_USER_KEY, this.currentUserId);
        this.notify();
    }

    getCurrentUser() {
        return this.state.users.find(u => u.id === this.currentUserId) || this.state.users[0];
    }

    setCurrentUser(userId) {
        this.currentUserId = userId;
        localStorage.setItem(CURRENT_USER_KEY, userId);
        const user = this.state.users.find(u => u.id === userId);
        if (user) {
            if (user.role === 'user') this.activeRole = 'farmer';
            else if (user.role === 'customer' || user.role === 'b2b_buyer') this.activeRole = 'consumer';
            else if (user.role === 'superadmin') this.activeRole = 'depot';
            localStorage.setItem(ACTIVE_ROLE_KEY, this.activeRole);
        }
        this.notify();
    }

    getCurrentFarm() {
        const user = this.getCurrentUser();
        return this.state.farms.find(f => f.owner_id === user.id) || this.state.farms[0];
    }

    // ── AUTH & REGISTRATION ───────────────────────────────────────────────────

    registerCustomer({ name, email, mobile_number, address }) {
        const existing = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            return { error: 'An account with this email already exists' };
        }

        const newUser = {
            id: `user-cust-${Date.now()}`,
            name,
            email,
            mobile_number,
            role: 'customer',
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
            is_first_login: false,
            address: address || { street: '', city: 'Bengaluru', state: 'Karnataka', pincode: '' },
            created_at: new Date().toISOString(),
        };

        this.state.users.push(newUser);
        this.currentUserId = newUser.id;
        this.activeRole = 'consumer';
        localStorage.setItem(ACTIVE_ROLE_KEY, 'consumer');
        localStorage.setItem(CURRENT_USER_KEY, newUser.id);
        this.saveState();
        return { data: newUser, error: null };
    }

    registerB2BBuyer({ name, email, mobile_number, b2b_profile }) {
        const existing = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
            return { error: 'An account with this email already exists' };
        }

        const newUser = {
            id: `user-b2b-${Date.now()}`,
            name,
            email,
            mobile_number,
            role: 'b2b_buyer',
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(b2b_profile?.company_name || name)}`,
            is_first_login: false,
            b2b_profile: {
                company_name: b2b_profile.company_name || '',
                business_type: b2b_profile.business_type || 'Supermarket / Retailer',
                gstin: b2b_profile.gstin || '',
                trade_license: b2b_profile.trade_license || 'PENDING-VERIFICATION',
                contact_person: name,
                warehouse_address: b2b_profile.warehouse_address || '',
            },
            created_at: new Date().toISOString(),
        };

        this.state.users.push(newUser);
        this.currentUserId = newUser.id;
        this.activeRole = 'consumer';
        localStorage.setItem(ACTIVE_ROLE_KEY, 'consumer');
        localStorage.setItem(CURRENT_USER_KEY, newUser.id);
        this.saveState();
        return { data: newUser, error: null };
    }

    login(email) {
        const user = this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return { error: 'No user found with this email' };
        }
        this.setCurrentUser(user.id);
        return { data: user, error: null };
    }

    // ── FARM MANAGEMENT ───────────────────────────────────────────────────────

    getFarms() {
        return this.state.farms.filter(f => f.is_active);
    }

    getFarmById(id) {
        return this.state.farms.find(f => f.id === id) || null;
    }

    createFarm(farmData) {
        const newFarm = {
            id: `farm-${Date.now()}`,
            owner_id: this.currentUserId,
            name: farmData.name,
            location: farmData.location || '',
            total_area: parseFloat(farmData.total_area || farmData.area || 5),
            area_unit: farmData.area_unit || farmData.areaUnit || 'acres',
            is_active: true,
            created_at: new Date().toISOString(),
        };
        this.state.farms.push(newFarm);
        this.saveState();
        return { data: newFarm, error: null };
    }

    // ── CROPS & HARVESTS ──────────────────────────────────────────────────────

    getCrops(farmId = this.getCurrentFarm()?.id, archived = false) {
        return this.state.crops.filter(c => c.farm_id === farmId && Boolean(c.is_archived) === Boolean(archived));
    }

    createCrop(cropData) {
        const newCrop = {
            id: `crop-${Date.now()}`,
            farm_id: cropData.farm_id || this.getCurrentFarm()?.id,
            name: cropData.name,
            variety: cropData.variety || '',
            area_planted: parseFloat(cropData.area_planted || 1),
            area_unit: cropData.area_unit || 'acres',
            planting_date: cropData.planting_date || new Date().toISOString().split('T')[0],
            expected_harvest_date: cropData.expected_harvest_date || null,
            is_archived: false,
            notes: cropData.notes || '',
            created_at: new Date().toISOString(),
        };
        this.state.crops.push(newCrop);
        this.saveState();
        return { data: newCrop, error: null };
    }

    harvestCrop(cropId, { quantity, unit = 'kg', harvest_date, notes = '' }) {
        const harvest = {
            id: `harvest-${Date.now()}`,
            crop_id: cropId,
            farm_id: this.getCurrentFarm()?.id,
            quantity: parseFloat(quantity),
            unit,
            harvest_date: harvest_date || new Date().toISOString().split('T')[0],
            notes,
            created_at: new Date().toISOString(),
        };
        this.state.crop_harvests.push(harvest);
        this.saveState();
        return { data: harvest, error: null };
    }

    segregateCrop(cropId, { source_grade = 'Unsegregated', target_grade, quantity, unit = 'kg', date }) {
        const seg = {
            id: `seg-${Date.now()}`,
            crop_id: cropId,
            farm_id: this.getCurrentFarm()?.id,
            source_grade,
            target_grade,
            quantity: parseFloat(quantity),
            unit,
            date: date || new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString(),
        };
        this.state.crop_segregations.push(seg);
        this.saveState();
        return { data: seg, error: null };
    }

    sellCrop(cropId, saleData) {
        const farm = this.getCurrentFarm();
        const sale = {
            id: `sale-${Date.now()}`,
            crop_id: cropId,
            farm_id: farm?.id,
            quantity: parseFloat(saleData.quantity),
            unit: saleData.unit || 'kg',
            unit_price: parseFloat(saleData.unit_price),
            total_amount: parseFloat(saleData.total_amount || (saleData.quantity * saleData.unit_price)),
            grade: saleData.grade || 'Grade A',
            buyer_name: saleData.buyer_name || 'Marketplace Customer',
            sale_date: saleData.sale_date || new Date().toISOString().split('T')[0],
            notes: saleData.notes || 'Recorded via direct sale',
            created_at: new Date().toISOString(),
        };

        if (!this.state.crop_sales) this.state.crop_sales = [];
        this.state.crop_sales.push(sale);

        const crop = this.getCropById(cropId);

        // Update financial transaction log
        this.state.financials.recentTransactions.unshift({
            id: `tx-${Date.now()}`,
            type: 'Revenue',
            description: `Sale: ${sale.quantity} ${sale.unit} to ${sale.buyer_name}`,
            amount: sale.total_amount,
            category: 'Crop Sale',
            crop_id: sale.crop_id,
            crop_name: crop?.name,
            crop_variety: crop?.variety,
            grade: sale.grade,
            quantity: sale.quantity,
            unit: sale.unit,
            unit_price: sale.unit_price,
            buyer_name: sale.buyer_name,
            date: sale.sale_date,
        });

        this.state.financials.summary.revenue += sale.total_amount;
        this.state.financials.summary.profit = this.state.financials.summary.revenue - this.state.financials.summary.expenses;

        this.saveState();
        return { data: sale, error: null };
    }

    // ── INVENTORY ─────────────────────────────────────────────────────────────

    getInventoryItems(farmId = this.getCurrentFarm()?.id) {
        return this.state.inventory_items.filter(i => i.farm_id === farmId);
    }

    getInventoryCategories(farmId = this.getCurrentFarm()?.id) {
        return this.state.inventory_categories.filter(c => c.farm_id === farmId || c.is_default);
    }

    createInventoryCategory({ name, farm_id = this.getCurrentFarm()?.id }) {
        const cat = {
            id: `cat-${Date.now()}`,
            farm_id,
            name,
            is_default: false,
        };
        this.state.inventory_categories.push(cat);
        this.saveState();
        return { data: cat, error: null };
    }

    createInventoryItem(itemData) {
        const item = {
            id: `inv-${Date.now()}`,
            farm_id: itemData.farm_id || this.getCurrentFarm()?.id,
            category_id: itemData.category_id,
            category_name: itemData.category_name || 'General',
            name: itemData.name,
            quantity: parseFloat(itemData.quantity || 0),
            unit: itemData.unit || 'units',
            cost_price: parseFloat(itemData.cost_price || 0),
            notes: itemData.notes || '',
        };
        this.state.inventory_items.push(item);
        this.saveState();
        return { data: item, error: null };
    }

    // ── WORKERS ───────────────────────────────────────────────────────────────

    getWorkers(farmId = this.getCurrentFarm()?.id) {
        return this.state.workers.filter(w => w.farm_id === farmId && w.is_active);
    }

    createWorker(workerData) {
        const worker = {
            id: `w-${Date.now()}`,
            farm_id: workerData.farm_id || this.getCurrentFarm()?.id,
            name: workerData.name,
            role: workerData.role || 'Field Worker',
            phone: workerData.phone || '',
            daily_wage: parseFloat(workerData.daily_wage || 500),
            is_active: true,
        };
        this.state.workers.push(worker);
        this.saveState();
        return { data: worker, error: null };
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MARKETPLACE METHODS
    // ═════════════════════════════════════════════════════════════════════════

    getListings({ channel, category, farmId, search } = {}) {
        let list = [...this.state.marketplace_listings];
        if (channel && channel !== 'all') {
            list = list.filter(l => l.channel === channel);
        }
        if (category && category !== 'all') {
            list = list.filter(l => l.category.toLowerCase().includes(category.toLowerCase()));
        }
        if (farmId) {
            list = list.filter(l => l.farm_id === farmId);
        }
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(l =>
                l.title.toLowerCase().includes(q) ||
                l.variety?.toLowerCase().includes(q) ||
                l.farm_name?.toLowerCase().includes(q) ||
                l.category?.toLowerCase().includes(q)
            );
        }
        return list;
    }

    getListingById(id) {
        return this.state.marketplace_listings.find(l => l.id === id) || null;
    }

    createListing(listingData) {
        const farm = this.getCurrentFarm();
        const user = this.getCurrentUser();

        const newListing = {
            id: `list-${Date.now()}`,
            farm_id: farm?.id || 'farm-1',
            farm_name: farm?.name || 'Deccan Organic Farms',
            farmer_name: user?.name || 'Ramesh Patel',
            farmer_avatar: user?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            crop_id: listingData.crop_id || null,
            title: listingData.title,
            category: listingData.category || 'Vegetables',
            variety: listingData.variety || '',
            grade: listingData.grade || 'Grade A',
            image_url: listingData.image_url || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
            description: listingData.description || '',
            channel: listingData.channel || 'direct', // 'direct' | 'hub_consignment' | 'b2b_bulk'
            pickup_available: listingData.pickup_available ?? true,
            courier_available: listingData.courier_available ?? true,
            pickup_address: farm?.pickup_address || farm?.location || 'Farm Gate',
            courier_fee_per_order: parseFloat(listingData.courier_fee_per_order || 40),
            unit: listingData.unit || 'kg',
            price_per_unit: parseFloat(listingData.price_per_unit || 40),
            min_order_qty: parseFloat(listingData.min_order_qty || 1),
            available_qty: parseFloat(listingData.available_qty || 100),
            bulk_tiers: listingData.bulk_tiers || null,
            harvest_date: listingData.harvest_date || new Date().toISOString().split('T')[0],
            status: 'active',
            is_certified_organic: Boolean(listingData.is_certified_organic),
            rating: 5.0,
            review_count: 0,
            created_at: new Date().toISOString(),
        };

        this.state.marketplace_listings.unshift(newListing);
        this.saveState();
        return { data: newListing, error: null };
    }

    updateListing(id, patch) {
        const idx = this.state.marketplace_listings.findIndex(l => l.id === id);
        if (idx === -1) return { error: 'Listing not found' };
        this.state.marketplace_listings[idx] = {
            ...this.state.marketplace_listings[idx],
            ...patch,
            updated_at: new Date().toISOString(),
        };
        this.saveState();
        return { data: this.state.marketplace_listings[idx], error: null };
    }

    deleteListing(id) {
        this.state.marketplace_listings = this.state.marketplace_listings.filter(l => l.id !== id);
        this.saveState();
        return { success: true };
    }

    // ── HUB CONSIGNMENTS (Channel 2) ──────────────────────────────────────────

    getConsignments(farmId = null) {
        if (farmId) {
            return this.state.hub_consignments.filter(c => c.farm_id === farmId);
        }
        return this.state.hub_consignments;
    }

    createConsignment(consignmentData) {
        const farm = this.getCurrentFarm();
        const user = this.getCurrentUser();

        let cropId = consignmentData.crop_id;
        if (!cropId && consignmentData.crop_name) {
            const matched = this.state.crops.find(c =>
                c.farm_id === (farm?.id || 'farm-1') &&
                c.name.toLowerCase().includes(consignmentData.crop_name.toLowerCase())
            );
            cropId = matched?.id;
        }

        const con = {
            id: `con-${Date.now().toString().slice(-4)}`,
            farm_id: farm?.id || 'farm-1',
            farm_name: farm?.name || 'Deccan Organic Farms',
            farmer_name: user?.name || 'Ramesh Patel',
            crop_id: cropId || null,
            crop_name: consignmentData.crop_name,
            grade_declared: consignmentData.grade_declared || 'Grade A',
            dispatched_qty: parseFloat(consignmentData.dispatched_qty),
            unit: consignmentData.unit || 'kg',
            dispatch_date: new Date().toISOString(),
            vehicle_number: consignmentData.vehicle_number || 'KA-04-E-1234',
            driver_name: consignmentData.driver_name || 'Transporter',
            hub_name: consignmentData.hub_name || 'farm360 Central Depot #1 (Bengaluru East)',
            status: 'in_transit',
            received_qty: null,
            transit_cull_qty: 0,
            qa_inspector: null,
            qa_grade_assigned: null,
            intake_timestamp: null,
            inspector_notes: consignmentData.notes || 'Dispatched from farm. In-transit.',
            published_to_marketplace: false,
            market_price_per_unit: parseFloat(consignmentData.expected_price_per_unit || 40),
        };

        this.state.hub_consignments.unshift(con);

        // Requirement 4.c: Central Hub — Once dispatched, quantity is updated at farmer's end to sold in crop_sales
        if (cropId) {
            if (!this.state.crop_sales) this.state.crop_sales = [];
            const sale = {
                id: `sale-hub-${Date.now()}`,
                crop_id: cropId,
                farm_id: con.farm_id,
                quantity: con.dispatched_qty,
                unit: con.unit,
                unit_price: con.market_price_per_unit,
                total_amount: con.dispatched_qty * con.market_price_per_unit,
                grade: con.grade_declared,
                buyer_name: `farm360 Central Hub (${con.hub_name.split('(')[0].trim()})`,
                sale_date: new Date().toISOString().split('T')[0],
                notes: `Hub Consignment #${con.id} — Dispatched via ${con.vehicle_number} (${con.driver_name})`,
                created_at: new Date().toISOString(),
            };
            this.state.crop_sales.push(sale);
        }

        this.saveState();
        return { data: con, error: null };
    }

    inwardAndGradeConsignment(consignmentId, { received_qty, transit_cull_qty, qa_grade, inspector_notes, price_per_unit, publish_to_store }) {
        const con = this.state.hub_consignments.find(c => c.id === consignmentId);
        if (!con) return { error: 'Consignment not found' };

        con.status = 'verified_and_stocked';
        con.received_qty = parseFloat(received_qty);
        con.transit_cull_qty = parseFloat(transit_cull_qty || 0);
        con.qa_grade_assigned = qa_grade || 'Grade A (Approved)';
        con.qa_inspector = this.getCurrentUser()?.name || 'Dr. Kiran Rao (Hub QA)';
        con.intake_timestamp = new Date().toISOString();
        con.inspector_notes = inspector_notes || 'Intake completed, weighed and quality checked.';
        con.published_to_marketplace = Boolean(publish_to_store);
        if (price_per_unit) con.market_price_per_unit = parseFloat(price_per_unit);

        // If published to marketplace, create or update a Hub Stock listing
        if (publish_to_store) {
            const hubListing = {
                id: `list-hub-${Date.now()}`,
                farm_id: 'farm-hub-central',
                farm_name: 'farm360 Central Hub (Verified Consignment)',
                farmer_name: `Consigned by ${con.farmer_name} (${con.farm_name})`,
                farmer_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                crop_id: null,
                title: `${con.crop_name} (Central Hub Stock)`,
                category: 'Fresh Produce',
                variety: con.crop_name,
                grade: con.qa_grade_assigned,
                image_url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600',
                description: `Inspected and verified at farm360 Central Depot. Sourced from ${con.farm_name}. Certified fresh, cold-chain handled, and ready for combined next-day delivery.`,
                channel: 'hub_consignment',
                pickup_available: false,
                courier_available: true,
                hub_name: con.hub_name,
                courier_fee_per_order: 30,
                unit: con.unit,
                price_per_unit: con.market_price_per_unit,
                min_order_qty: 1,
                available_qty: con.received_qty,
                harvest_date: new Date().toISOString().split('T')[0],
                status: 'active',
                is_certified_organic: true,
                rating: 5.0,
                review_count: 1,
                created_at: new Date().toISOString(),
            };
            this.state.marketplace_listings.unshift(hubListing);
        }

        this.saveState();
        return { data: con, error: null };
    }

    // ── ORDERS & PICKUPS ──────────────────────────────────────────────────────

    getOrders({ customerId, farmId, channel, status } = {}) {
        let list = [...this.state.marketplace_orders];
        if (customerId) list = list.filter(o => o.customer_id === customerId);
        if (farmId) list = list.filter(o => o.farm_id === farmId);
        if (channel) list = list.filter(o => o.channel === channel);
        if (status) list = list.filter(o => o.status === status);
        return list;
    }

    getOrderById(id) {
        return this.state.marketplace_orders.find(o => o.id === id || o.order_number === id) || null;
    }

    placeOrder({ items, fulfillment_type, pickup_details, shipping_address, payment_method }) {
        const user = this.getCurrentUser();
        if (!user || user.role === 'user') {
            return { error: 'Please register or sign in as a customer or wholesale buyer to place an order.' };
        }

        if (!items || items.length === 0) {
            return { error: 'Cart is empty' };
        }

        // Determine primary channel and farm
        const firstItem = items[0];
        const listing = this.getListingById(firstItem.listing_id);
        const channel = listing?.channel || 'direct';
        const farm_id = listing?.farm_id || 'farm-1';
        const farm_name = listing?.farm_name || 'Farm Direct';

        const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const shipping_fee = fulfillment_type === 'farm_pickup' ? 0 : (listing?.courier_fee_per_order || 40);
        const total_amount = subtotal + shipping_fee;

        // Generate 6-digit verification PIN for farm pickup or courier delivery
        let pickup_code = null;
        let delivery_code = null;
        if (fulfillment_type === 'farm_pickup') {
            const part1 = Math.floor(100 + Math.random() * 900);
            const part2 = Math.floor(100 + Math.random() * 900);
            pickup_code = `${part1}-${part2}`;
        } else if (fulfillment_type === 'direct_courier') {
            const part1 = Math.floor(100 + Math.random() * 900);
            const part2 = Math.floor(100 + Math.random() * 900);
            delivery_code = `${part1}-${part2}`;
        }

        // Requirement 2: D2C farm pickup or courier requires farmer approval before sharing code with customer!
        const requiresFarmerApproval = (fulfillment_type === 'farm_pickup' || fulfillment_type === 'direct_courier') && channel === 'direct';
        const initialStatus = requiresFarmerApproval ? 'pending_farmer_approval' : (fulfillment_type === 'farm_pickup' ? 'ready_for_pickup' : 'confirmed');
        const isApproved = !requiresFarmerApproval;

        const newOrder = {
            id: `ord-${Date.now()}`,
            order_number: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            customer_id: user.id,
            customer_name: user.name,
            customer_phone: user.mobile_number,
            customer_type: user.role === 'b2b_buyer' ? 'b2b_wholesale' : 'retail_consumer',
            b2b_details: user.b2b_profile || null,
            farm_id,
            farm_name,
            channel,
            fulfillment_type, // 'farm_pickup' | 'direct_courier' | 'hub_delivery' | 'b2b_freight'
            is_approved: isApproved,
            pickup_details: fulfillment_type === 'farm_pickup' ? {
                location: listing?.pickup_address || 'Farm Gate',
                slot: pickup_details?.slot || 'Tomorrow, 10:00 AM – 1:00 PM',
                pickup_code,
            } : null,
            delivery_code,
            shipping_address: fulfillment_type !== 'farm_pickup' ? (shipping_address || user.address) : null,
            items: items.map(item => {
                const listing = this.getListingById(item.listing_id);
                return {
                    listing_id: item.listing_id,
                    crop_id: item.crop_id || listing?.crop_id || null,
                    title: item.title,
                    variety: item.variety || '',
                    grade: item.grade || 'Grade A',
                    quantity: item.quantity,
                    unit: item.unit || 'kg',
                    unit_price: item.unit_price,
                    total_price: item.unit_price * item.quantity,
                };
            }),
            subtotal,
            shipping_fee,
            tax_amount: user.role === 'b2b_buyer' ? Math.round(subtotal * 0.05) : 0,
            total_amount: user.role === 'b2b_buyer' ? Math.round(total_amount + (subtotal * 0.05)) : total_amount,
            payment_method: payment_method || (fulfillment_type === 'farm_pickup' ? 'pay_at_pickup' : 'online_escrow'),
            payment_status: fulfillment_type === 'farm_pickup' ? 'pending_pickup' : 'escrow_held',
            status: initialStatus,
            timeline: [
                {
                    status: initialStatus,
                    label: requiresFarmerApproval ? 'Order Placed (Awaiting Farmer Approval)' : 'Order Placed',
                    timestamp: new Date().toISOString(),
                    note: requiresFarmerApproval
                        ? 'Order sent to farmer for harvest & stock approval. Verification code will unlock once the farmer approves.'
                        : (fulfillment_type === 'farm_pickup'
                            ? `Pickup PIN: ${pickup_code}. Scheduled for ${pickup_details?.slot || 'Tomorrow morning'}`
                            : 'Payment authorized & order logged with farm.'),
                },
            ],
            created_at: new Date().toISOString(),
        };

        // Deduct inventory from listings
        items.forEach(item => {
            const listObj = this.getListingById(item.listing_id);
            if (listObj) {
                listObj.available_qty = Math.max(0, listObj.available_qty - item.quantity);
            }
        });

        this.state.marketplace_orders.unshift(newOrder);
        this.saveState();
        return { data: newOrder, error: null };
    }

    verifyPickupPin(orderId, enteredPin) {
        const order = this.getOrderById(orderId);
        if (!order) return { error: 'Order not found' };

        if (!order.pickup_details || !order.pickup_details.pickup_code) {
            return { error: 'This order is not a farm pickup order.' };
        }

        const cleanExpected = order.pickup_details.pickup_code.replace(/[-\s]/g, '');
        const cleanEntered = (enteredPin || '').replace(/[-\s]/g, '');

        if (cleanExpected !== cleanEntered) {
            return { error: `Invalid Pickup PIN! Customer PIN does not match (${cleanEntered}).` };
        }

        order.status = 'completed';
        order.payment_status = 'released_to_farmer';
        order.timeline.push({
            status: 'completed',
            label: 'Handed Over & Verified',
            timestamp: new Date().toISOString(),
            note: `Farmer verified customer PIN (${order.pickup_details.pickup_code}) at farm gate. Payment released.`,
        });

        // Requirement 4.a: ONLY after PIN verification, record in crop_sales to update sold quantity
        if (!this.state.crop_sales) this.state.crop_sales = [];
        (order.items || []).forEach(item => {
            const cropId = item.crop_id || this.getListingById(item.listing_id)?.crop_id;
            if (cropId) {
                const sale = {
                    id: `sale-b2c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    crop_id: cropId,
                    farm_id: order.farm_id,
                    quantity: parseFloat(item.quantity),
                    unit: item.unit || 'kg',
                    unit_price: parseFloat(item.unit_price),
                    total_amount: parseFloat(item.total_price || (item.quantity * item.unit_price)),
                    grade: item.grade || 'Grade A',
                    buyer_name: `${order.customer_name} (B2C PIN Verified)`,
                    sale_date: new Date().toISOString().split('T')[0],
                    notes: `B2C Order #${order.order_number} verified with PIN ${order.pickup_details.pickup_code}`,
                    created_at: new Date().toISOString(),
                };
                this.state.crop_sales.push(sale);
            }
        });

        // Automatically log this sale into the farmer's financial transaction log
        const farm = this.state.farms.find(f => f.id === order.farm_id);
        if (farm) {
            order.items.forEach(item => {
                const crop = this.getCropById(item.crop_id);
                this.state.financials.recentTransactions.unshift({
                    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    type: 'Revenue',
                    description: `Direct Farm Pickup: Order #${order.order_number} (${order.customer_name})`,
                    amount: parseFloat(item.total_price || (item.quantity * item.unit_price)),
                    category: 'Crop Sale',
                    crop_id: item.crop_id,
                    crop_name: crop?.name || item.name,
                    crop_variety: crop?.variety,
                    grade: item.grade || 'Grade A',
                    quantity: item.quantity,
                    unit: item.unit || 'kg',
                    unit_price: item.unit_price,
                    buyer_name: order.customer_name,
                    date: new Date().toISOString().split('T')[0],
                });
            });
            this.state.financials.summary.revenue += order.total_amount;
            this.state.financials.summary.profit = this.state.financials.summary.revenue - this.state.financials.summary.expenses;
        }

        this.saveState();
        return { data: order, error: null };
    }

    dispatchDirectCourier(orderId, { carrier_name, tracking_number, tracking_url }) {
        const order = this.getOrderById(orderId);
        if (!order) return { error: 'Order not found' };

        order.status = 'dispatched';
        order.carrier_name = carrier_name || 'Express Logistics';
        order.tracking_number = tracking_number || `EXP-${Math.floor(100000 + Math.random() * 900000)}`;
        order.tracking_url = tracking_url || '#';
        order.timeline.push({
            status: 'dispatched',
            label: 'Dispatched via Courier',
            timestamp: new Date().toISOString(),
            note: `Handed over to ${order.carrier_name}. Tracking ID: ${order.tracking_number}`,
        });

        this.saveState();
        return { data: order, error: null };
    }

    markOrderDelivered(orderId) {
        const order = this.getOrderById(orderId);
        if (!order) return { error: 'Order not found' };

        order.status = 'delivered';
        order.payment_status = 'released_to_farmer';
        order.timeline.push({
            status: 'delivered',
            label: 'Delivered to Customer',
            timestamp: new Date().toISOString(),
            note: 'Package received by customer. Escrow funds credited to farmer.',
        });

        // Record into crop_sales when courier delivery is verified/completed
        if (!this.state.crop_sales) this.state.crop_sales = [];
        (order.items || []).forEach(item => {
            const cropId = item.crop_id || this.getListingById(item.listing_id)?.crop_id;
            if (cropId) {
                const sale = {
                    id: `sale-courier-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    crop_id: cropId,
                    farm_id: order.farm_id,
                    quantity: parseFloat(item.quantity),
                    unit: item.unit || 'kg',
                    unit_price: parseFloat(item.unit_price),
                    total_amount: parseFloat(item.total_price || (item.quantity * item.unit_price)),
                    grade: item.grade || 'Grade A',
                    buyer_name: `${order.customer_name} (B2C Courier Delivered)`,
                    sale_date: new Date().toISOString().split('T')[0],
                    notes: `B2C Order #${order.order_number} delivered via ${order.carrier_name || 'Courier'}`,
                    created_at: new Date().toISOString(),
                };
                this.state.crop_sales.push(sale);
            }
        });

        // Automatically credit farmer ledger
        order.items.forEach(item => {
            const crop = this.getCropById(item.crop_id);
            this.state.financials.recentTransactions.unshift({
                id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                type: 'Revenue',
                description: `Courier Delivery: Order #${order.order_number} (${order.customer_name})`,
                amount: parseFloat(item.total_price || (item.quantity * item.unit_price)),
                category: 'Crop Sale',
                crop_id: item.crop_id,
                crop_name: crop?.name || item.name,
                crop_variety: crop?.variety,
                grade: item.grade || 'Grade A',
                quantity: item.quantity,
                unit: item.unit || 'kg',
                unit_price: item.unit_price,
                buyer_name: order.customer_name,
                date: new Date().toISOString().split('T')[0],
            });
        });
        this.state.financials.summary.revenue += order.subtotal;
        this.state.financials.summary.profit = this.state.financials.summary.revenue - this.state.financials.summary.expenses;

        this.saveState();
        return { data: order, error: null };
    }

    // Requirement 2: Farmer Approves D2C Order (Only then is code unlocked & shared with customer)
    approveOrder(orderId) {
        const order = this.getOrderById(orderId);
        if (!order) return { error: 'Order not found' };

        order.is_approved = true;
        if (order.fulfillment_type === 'farm_pickup') {
            order.status = 'ready_for_pickup';
            order.timeline.push({
                status: 'ready_for_pickup',
                label: 'Order Approved by Farmer',
                timestamp: new Date().toISOString(),
                note: `Farmer approved your order for fresh harvest! Verification PIN unlocked (${order.pickup_details?.pickup_code}). Ready for pickup at ${order.pickup_details?.slot}.`,
            });
        } else {
            order.status = 'confirmed';
            order.timeline.push({
                status: 'confirmed',
                label: 'Order Approved by Farmer',
                timestamp: new Date().toISOString(),
                note: `Farmer approved your order for fresh harvest! Delivery code unlocked (${order.delivery_code}). Order is being packed for courier dispatch.`,
            });
        }

        this.saveState();
        return { data: order, error: null };
    }

    declineOrder(orderId, reason = 'Fresh harvest unavailable') {
        const order = this.getOrderById(orderId);
        if (!order) return { error: 'Order not found' };

        order.status = 'declined';
        order.timeline.push({
            status: 'declined',
            label: 'Order Declined',
            timestamp: new Date().toISOString(),
            note: `Declined by farmer: ${reason}`,
        });

        // Restore listing stock
        order.items.forEach(item => {
            const listObj = this.getListingById(item.listing_id);
            if (listObj) {
                listObj.available_qty += item.quantity;
            }
        });

        this.saveState();
        return { data: order, error: null };
    }

    // Requirement 3: Confirm Receipt of Courier Delivery (Verifies code and moves quantity to sold)
    confirmCourierReceipt(orderId, enteredCode = null) {
        const order = this.getOrderById(orderId);
        if (!order) return { error: 'Order not found' };

        if (enteredCode && order.delivery_code) {
            const cleanExpected = order.delivery_code.replace(/[-\s]/g, '');
            const cleanEntered = enteredCode.replace(/[-\s]/g, '');
            if (cleanExpected !== cleanEntered) {
                return { error: `Invalid Delivery Code! Customer code does not match (${cleanEntered}).` };
            }
        }

        order.status = 'delivered';
        order.payment_status = 'released_to_farmer';
        order.timeline.push({
            status: 'delivered',
            label: 'Delivered & Receipt Confirmed',
            timestamp: new Date().toISOString(),
            note: `Package delivery confirmed. Code ${order.delivery_code || 'verified'}. Escrow payment released to farmer.`,
        });

        // Requirement 4.a: Move to crop_sales upon receipt confirmation
        if (!this.state.crop_sales) this.state.crop_sales = [];
        (order.items || []).forEach(item => {
            const cropId = item.crop_id || this.getListingById(item.listing_id)?.crop_id;
            if (cropId) {
                const sale = {
                    id: `sale-courier-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    crop_id: cropId,
                    farm_id: order.farm_id,
                    quantity: parseFloat(item.quantity),
                    unit: item.unit || 'kg',
                    unit_price: parseFloat(item.unit_price),
                    total_amount: parseFloat(item.total_price || (item.quantity * item.unit_price)),
                    grade: item.grade || 'Grade A',
                    buyer_name: `${order.customer_name} (B2C Courier Delivered)`,
                    sale_date: new Date().toISOString().split('T')[0],
                    notes: `B2C Order #${order.order_number} receipt confirmed with code ${order.delivery_code || 'verified'}`,
                    created_at: new Date().toISOString(),
                };
                this.state.crop_sales.push(sale);
            }
        });

        // Credit farmer ledger
        const farm = this.state.farms.find(f => f.id === order.farm_id);
        if (farm) {
            this.state.financials.recentTransactions.unshift({
                id: `tx-${Date.now()}`,
                type: 'Revenue',
                description: `Courier Delivery Confirmed: Order #${order.order_number} (${order.customer_name})`,
                amount: order.subtotal,
                category: 'Crop Sale',
                date: new Date().toISOString().split('T')[0],
            });
            this.state.financials.summary.revenue += order.subtotal;
            this.state.financials.summary.profit = this.state.financials.summary.revenue - this.state.financials.summary.expenses;
        }

        this.saveState();
        return { data: order, error: null };
    }

    // ── B2B RFQ NEGOTIATIONS (Channel 3) ──────────────────────────────────────

    getRfqs({ farmId, buyerId } = {}) {
        let list = [...this.state.b2b_rfqs];
        if (farmId) list = list.filter(r => r.farm_id === farmId);
        if (buyerId) list = list.filter(r => r.buyer_id === buyerId);
        return list;
    }

    submitRfq({ listing_id, requested_qty, target_price_per_unit, required_by_date, buyer_notes, delivery_location }) {
        const user = this.getCurrentUser();
        if (!user) {
            return { error: 'Please sign in or register to submit a bulk price request.' };
        }

        const listing = this.getListingById(listing_id);
        if (!listing) return { error: 'Listing not found' };

        const rfq = {
            id: `rfq-${Date.now().toString().slice(-4)}`,
            rfq_number: `RFQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
            buyer_id: user.id,
            buyer_name: user.b2b_profile?.company_name || user.name,
            buyer_contact: `${user.name} (${user.b2b_profile?.business_type || 'Procurement'})`,
            buyer_phone: user.mobile_number,
            buyer_gstin: user.b2b_profile?.gstin || '29ABCDE1234F1Z5',
            farm_id: listing.farm_id,
            farm_name: listing.farm_name,
            farmer_name: listing.farmer_name,
            crop_name: listing.title,
            requested_qty: parseFloat(requested_qty),
            unit: listing.unit,
            target_price_per_unit: parseFloat(target_price_per_unit),
            current_listing_price: listing.price_per_unit,
            delivery_location: delivery_location || user.b2b_profile?.warehouse_address || 'Buyer Warehouse',
            required_by_date: required_by_date || '2025-09-10',
            buyer_notes: buyer_notes || 'Wholesale purchase request for retail distribution.',
            status: 'open',
            history: [
                {
                    by: 'buyer',
                    action: 'submitted_rfq',
                    price: parseFloat(target_price_per_unit),
                    qty: parseFloat(requested_qty),
                    timestamp: new Date().toISOString(),
                    message: buyer_notes || `Proposed ${requested_qty} ${listing.unit} at ₹${target_price_per_unit}/${listing.unit}.`,
                },
            ],
            created_at: new Date().toISOString(),
        };

        this.state.b2b_rfqs.unshift(rfq);
        this.saveState();
        return { data: rfq, error: null };
    }

    farmerCounterRfq(rfqId, { counter_price, message }) {
        const rfq = this.state.b2b_rfqs.find(r => r.id === rfqId);
        if (!rfq) return { error: 'RFQ not found' };

        rfq.status = 'counter_offered';
        rfq.history.push({
            by: 'farmer',
            action: 'counter_offered',
            price: parseFloat(counter_price),
            qty: rfq.requested_qty,
            timestamp: new Date().toISOString(),
            message: message || `Farmer offered revised price of ₹${counter_price}/${rfq.unit}.`,
        });

        this.saveState();
        return { data: rfq, error: null };
    }

    buyerCounterRfq(rfqId, { counter_price, message }) {
        const rfq = this.state.b2b_rfqs.find(r => r.id === rfqId);
        if (!rfq) return { error: 'RFQ not found' };

        rfq.status = 'buyer_countered';
        rfq.history.push({
            by: 'buyer',
            action: 'buyer_countered',
            price: parseFloat(counter_price),
            qty: rfq.requested_qty,
            timestamp: new Date().toISOString(),
            message: message || `Buyer countered with revised price of ₹${counter_price}/${rfq.unit}.`,
        });

        this.saveState();
        return { data: rfq, error: null };
    }

    declineRfq(rfqId, declinedBy = 'buyer', reason = '') {
        const rfq = this.state.b2b_rfqs.find(r => r.id === rfqId);
        if (!rfq) return { error: 'RFQ not found' };

        rfq.status = 'declined';
        const lastOffer = rfq.history[rfq.history.length - 1];
        rfq.history.push({
            by: declinedBy,
            action: 'declined',
            price: lastOffer ? lastOffer.price : rfq.target_price_per_unit,
            qty: rfq.requested_qty,
            timestamp: new Date().toISOString(),
            message: reason || `${declinedBy === 'buyer' ? 'Buyer' : 'Farmer'} declined the proposal. Negotiation closed.`,
        });

        this.saveState();
        return { data: rfq, error: null };
    }

    acceptRfq(rfqId, acceptedBy = 'buyer') {
        const rfq = this.state.b2b_rfqs.find(r => r.id === rfqId);
        if (!rfq) return { error: 'RFQ not found' };

        rfq.status = 'accepted';
        const lastOffer = rfq.history[rfq.history.length - 1];
        const agreedPrice = lastOffer ? lastOffer.price : rfq.target_price_per_unit;

        rfq.history.push({
            by: acceptedBy,
            action: 'accepted',
            price: agreedPrice,
            qty: rfq.requested_qty,
            timestamp: new Date().toISOString(),
            message: `Deal agreed and accepted at ₹${agreedPrice}/${rfq.unit} for ${rfq.requested_qty} ${rfq.unit}.`,
        });

        // Convert into a confirmed B2B order
        const subtotal = agreedPrice * rfq.requested_qty;
        const tax = Math.round(subtotal * 0.05);
        const freight = 2500;
        const total = subtotal + tax + freight;

        const matchedCrop = this.state.crops.find(c => c.farm_id === rfq.farm_id && c.name.toLowerCase().includes(rfq.crop_name.toLowerCase()));
        const cropId = rfq.crop_id || matchedCrop?.id || null;

        const b2bOrder = {
            id: `ord-b2b-${Date.now()}`,
            order_number: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-B2B`,
            customer_id: rfq.buyer_id,
            customer_name: rfq.buyer_name,
            customer_phone: rfq.buyer_phone,
            customer_type: 'b2b_wholesale',
            b2b_details: {
                company_name: rfq.buyer_name,
                gstin: rfq.buyer_gstin,
                rfq_number: rfq.rfq_number,
            },
            farm_id: rfq.farm_id,
            farm_name: rfq.farm_name,
            channel: 'b2b_bulk',
            fulfillment_type: 'b2b_freight',
            shipping_address: {
                street: rfq.delivery_location,
                city: 'Bengaluru',
                state: 'Karnataka',
                pincode: '560022',
            },
            items: [
                {
                    listing_id: 'rfq-deal',
                    crop_id: cropId,
                    title: `${rfq.crop_name} (B2B Bulk Deal)`,
                    variety: 'Contract Grade',
                    grade: 'Commercial / Export',
                    quantity: rfq.requested_qty,
                    unit: rfq.unit,
                    unit_price: agreedPrice,
                    total_price: subtotal,
                },
            ],
            subtotal,
            shipping_fee: freight,
            tax_amount: tax,
            total_amount: total,
            payment_method: 'bank_transfer_milestone',
            payment_status: `Agreed: 20% advance (₹${Math.round(total * 0.2).toLocaleString()}); 80% upon loading.`,
            is_approved: true,
            status: 'confirmed',
            timeline: [
                { status: 'rfq_accepted', label: 'RFQ Finalized', timestamp: new Date().toISOString(), note: `Converted from ${rfq.rfq_number}` },
            ],
            created_at: new Date().toISOString(),
        };

        this.state.marketplace_orders.unshift(b2bOrder);
        this.saveState();
        return { data: { rfq, order: b2bOrder }, error: null };
    }

    // Requirement 4.b: B2B Wholesale — Post user sends / marks loaded on truck, quantity is updated to sold in crop_sales
    dispatchB2BOrder(orderId, { vehicle_number, driver_name, notes } = {}) {
        const order = this.getOrderById(orderId);
        if (!order) return { error: 'Order not found' };

        order.status = 'dispatched';
        order.vehicle_number = vehicle_number || 'KA-04-E-5566';
        order.driver_name = driver_name || 'Fleet Logistics Transporter';
        order.timeline.push({
            status: 'dispatched',
            label: 'Loaded on Truck & Dispatched',
            timestamp: new Date().toISOString(),
            note: notes || `Dispatched on vehicle ${order.vehicle_number} (${order.driver_name}) to buyer facility.`,
        });

        // Update crop_sales strictly post dispatch
        if (!this.state.crop_sales) this.state.crop_sales = [];
        (order.items || []).forEach(item => {
            const cropId = item.crop_id || this.getListingById(item.listing_id)?.crop_id;
            if (cropId) {
                const sale = {
                    id: `sale-b2b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    crop_id: cropId,
                    farm_id: order.farm_id,
                    quantity: parseFloat(item.quantity),
                    unit: item.unit || 'kg',
                    unit_price: parseFloat(item.unit_price),
                    total_amount: parseFloat(item.total_price || (item.quantity * item.unit_price)),
                    grade: item.grade || 'Commercial Grade',
                    buyer_name: `${order.customer_name} (B2B Dispatched)`,
                    sale_date: new Date().toISOString().split('T')[0],
                    notes: `B2B Order #${order.order_number} — Dispatched on Truck ${order.vehicle_number}`,
                    created_at: new Date().toISOString(),
                };
                this.state.crop_sales.push(sale);
            }
        });

        // Update financials
        order.items.forEach(item => {
            const crop = this.getCropById(item.crop_id);
            this.state.financials.recentTransactions.unshift({
                id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                type: 'Revenue',
                description: `B2B Wholesale Dispatched: Order #${order.order_number} (${order.customer_name})`,
                amount: parseFloat(item.total_price || (item.quantity * item.unit_price)),
                category: 'Crop Sale',
                crop_id: item.crop_id,
                crop_name: crop?.name || item.name,
                crop_variety: crop?.variety,
                grade: item.grade || 'Commercial Grade',
                quantity: item.quantity,
                unit: item.unit || 'kg',
                unit_price: item.unit_price,
                buyer_name: order.customer_name,
                date: new Date().toISOString().split('T')[0],
            });
        });
        this.state.financials.summary.revenue += order.total_amount;
        this.state.financials.summary.profit = this.state.financials.summary.revenue - this.state.financials.summary.expenses;

        this.saveState();
        return { data: order, error: null };
    }

    // B2B Wholesale — Confirm Reception of Freight Shipment by Buyer
    confirmB2BReception(orderId, { inward_notes, inspector_name, received_qty, gate_pass_number } = {}) {
        const order = this.getOrderById(orderId);
        if (!order) return { error: 'Order not found' };

        // If the order was in 'confirmed' or 'pending_farmer_approval', dispatch it first to ensure crop_sales and truck are populated
        if (order.status !== 'dispatched' && order.status !== 'delivered' && order.status !== 'completed') {
            this.dispatchB2BOrder(orderId, {
                vehicle_number: order.vehicle_number || 'KA-04-E-5566',
                driver_name: order.driver_name || 'Fleet Logistics Transporter',
                notes: 'Auto-dispatched prior to buyer inward reception confirmation.'
            });
        }

        order.status = 'delivered';
        order.payment_status = '100% Settled (Full payment released to farmer)';

        const inspector = inspector_name || 'Warehouse Inward Officer';
        const gatePass = gate_pass_number || `GP-IN-${Date.now().toString().slice(-6)}`;
        const notes = inward_notes || 'All crates verified, weighed, and accepted into buyer facility stock.';
        const qtyReceived = received_qty || (order.items?.[0] ? `${order.items[0].quantity} ${order.items[0].unit || 'kg'}` : 'Full Consignment');

        order.reception_details = {
            received_at: new Date().toISOString(),
            inspector_name: inspector,
            gate_pass_number: gatePass,
            received_qty: qtyReceived,
            notes: notes,
            is_verified: true,
        };

        order.timeline.push({
            status: 'delivered',
            label: 'Wholesale Shipment Inward Verified & Received',
            timestamp: new Date().toISOString(),
            note: `Received at buyer warehouse by ${inspector} (Gate Pass #${gatePass}). ${notes}`,
        });

        this.saveState();
        return { data: order, error: null };
    }
}

export const mockStore = new MockStore();
