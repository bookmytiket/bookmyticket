import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors } from '../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

function DataTable({ title, data, columns, renderItem }) {
  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>{title}</Text>
        <Text style={styles.tableCount}>{data?.length || 0} Total</Text>
      </View>
      <View style={styles.columnHeaders}>
        {columns.map((col, idx) => (
          <Text key={idx} style={[styles.columnHeader, { flex: col.flex || 1, textAlign: col.align || 'left' }]}>{col.label}</Text>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(item, index) => item._id || item.id || `row-${index}-${item.label || ''}`}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            {renderItem(item)}
          </View>
        )}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>No records found</Text>}
      />
    </View>
  );
}
export default function ManagementScreen() {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  
  const isServiceProvider = (category) => {
    if (!category) return false;
    const c = String(category).trim().toLowerCase();
    return c.includes("mehandi") || 
           c.includes("mehendi") || 
           c.includes("photograph") || 
           c.includes("makeup") || 
           c.includes("artist") || 
           c.includes("personal service");
  };

  // 1. CALL ALL HOOKS AT THE TOP LEVEL
  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';
  const isOrganiser = user?.role === 'organiser';
  const isVendor = isServiceProvider(user?.category);
  
  const [activeTab, setActiveTab] = useState(isStaff ? 'scans' : isVendor ? 'hub' : 'events');
  const [isEditing, setIsEditing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [portfolioMeta, setPortfolioMeta] = useState({ 
    url: '', 
    category: 'Bridal', 
    isTopDesign: false, 
    beforeAfter: false 
  });
  const [editItem, setEditItem] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isAddingPkg, setIsAddingPkg] = useState(false);
  const [newPkg, setNewPkg] = useState({ label: '', description: '', price: '' });

  // Queries
  const vendorId = user?.identifier || "";
  const eventsWithAnalytics = useQuery(api.events.getEventsWithAnalytics) || [];
  const bookings = useQuery(api.bookings.getBookings) || [];
  const vendorBookings = useQuery(api.vendorBookings.list, { vendorId }) || [];
  const organiserEvents = useQuery(api.events.getOrganiserEvents, { organiserId: vendorId }) || [];
  const reviews = useQuery(api.vendorReviews.getVendorReviews, { vendorId }) || [];
  const vendorStats = useQuery(api.vendors.getStats, { vendorId });
  const vendorProfile = useQuery(api.vendors.getByOrganiserId, { organiserId: vendorId });
  
  const updateProfile = useMutation(api.vendors.updateProfile);
  const respondToReview = useMutation(api.vendorReviews.respondToReview);

  const handleRespond = async (id) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await respondToReview({ id, response: replyText });
      setReplyingTo(null);
      setReplyText("");
    } catch (err) {
      Alert.alert("Error", "Failed to submit response.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const totals = {
    bookings: organiserEvents.reduce((acc, e) => acc + (e.bookingsCount || 0), 0),
    revenue: organiserEvents.reduce((acc, e) => acc + (e.revenue || 0), 0),
    rating: reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0"
  };

  const currentOrganiserId = user?.organiserId || user?.identifier || user?.id || "";
  const scans = useQuery(api.pwaScans.getScansByOrganiser, { 
    organiserId: currentOrganiserId
  }) || [];
  
  const confirmBookingMutation = useMutation(api.bookings.confirmBooking);
  const updateVendorBookingStatus = useMutation(api.vendorBookings.updateStatus);
  const updateVendorProfile = useMutation(api.vendors.updateProfile);
  const internalMeetingPortalEnabled = true; 
  const toggleInternalPortalMutation = useMutation(api.meetings.toggleInternalPortal);
  
  const sinceTime = React.useMemo(() => Date.now() - (24 * 60 * 60 * 1000), []);
  const failedLogins = useQuery(api.auth.getRecentFailedAttempts, { identifier: "", since: sinceTime }) || [];

  const handleConfirm = async (id) => {
    try {
      await confirmBookingMutation({ id });
      Alert.alert('Success', 'Booking confirmed successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to confirm booking');
    }
  };

  const handleUpdateVendorBooking = async (id, status) => {
    try {
      await updateVendorBookingStatus({ id, status });
      Alert.alert('Success', `Booking marked as ${status}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to update booking');
    }
  };

  const [profileForm, setProfileForm] = useState({
    firstName: user?.name?.split(' ')[0] || "",
    lastName: user?.name?.split(' ')[1] || "",
    bio: vendorProfile?.bio || "",
    category: vendorProfile?.category || user?.category || "",
    phone: user?.phone || "",
    address: ""
  });

  useEffect(() => {
    if (vendorProfile || user) {
      setProfileForm({
        firstName: user?.name?.split(' ')[0] || "",
        lastName: user?.name?.split(' ')[1] || "",
        bio: vendorProfile?.bio || "",
        category: vendorProfile?.category || user?.category || "",
        phone: user?.phone || "",
        address: "" // We'll fetch this from KYC if needed
      });
    }
  }, [vendorProfile, user]);

  const handleUpdateProfile = async (updates) => {
    try {
      await updateVendorProfile({ organiserId: user?.identifier || "", ...updates });
      Alert.alert('Success', 'Profile updated successfully');
      setActiveTab('hub');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const addPortfolioItem = () => {
    if (!portfolioMeta.url) {
      Alert.alert('Required', 'Please provide a media URL.');
      return;
    }
    const currentPortfolio = vendorProfile?.portfolio || [];
    const newItem = {
      url: portfolioMeta.url,
      type: portfolioMeta.url.includes('mp4') || portfolioMeta.url.includes('mov') ? 'video' : 'image',
      category: portfolioMeta.category,
      isTopDesign: portfolioMeta.isTopDesign,
      beforeAfter: portfolioMeta.beforeAfter,
      tags: []
    };
    handleUpdateProfile({ 
      portfolio: [...currentPortfolio, newItem],
      category: vendorProfile?.category || user?.category || ""
    });
    setIsAddingPortfolio(false);
    setPortfolioMeta({ url: '', category: 'Bridal', isTopDesign: false, beforeAfter: false });
  };

  const deletePortfolioImage = (url) => {
    const currentPortfolio = vendorProfile?.portfolio || [];
    handleUpdateProfile({ 
      portfolio: currentPortfolio.filter(img => img.url !== url),
      category: vendorProfile?.category || user?.category || ""
    });
  };

  const updatePrice = (identifier, newPrice) => {
    const currentPricing = vendorProfile?.pricing || [];
    const updated = currentPricing.map(p => {
      const pId = p.label || p.name;
      return pId === identifier ? { ...p, price: parseFloat(newPrice) } : p;
    });
    handleUpdateProfile({ 
      pricing: updated,
      category: vendorProfile?.category || user?.category || ""
    });
    setEditItem(null);
  };

  const createPackage = () => {
    if (!newPkg.label || !newPkg.price) {
      Alert.alert('Required', 'Please provide at least a name and price.');
      return;
    }
    const currentPricing = vendorProfile?.pricing || [];
    const updated = [...currentPricing, { 
      label: newPkg.name || newPkg.label, 
      description: newPkg.description, 
      price: parseFloat(newPkg.price) 
    }];
    handleUpdateProfile({ 
      pricing: updated,
      category: vendorProfile?.category || user?.category || ""
    });
    setIsAddingPkg(false);
    setNewPkg({ label: '', description: '', price: '' });
  };

  // 2. NOW APPLY LOADING/ACCESS GUARDS
  if (authLoading || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading dashboard...</Text>
      </View>
    );
  }

  // Only block non-vendor organisers
  if (isOrganiser && !isVendor) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
        <Ionicons name="lock-closed" size={80} color={Colors.secondary} />
        <Text style={[styles.title, { textAlign: 'center', marginTop: 24, color: Colors.text }]}>Access Restricted</Text>
        <Text style={[styles.sub, { textAlign: 'center', marginTop: 12, fontSize: 16, color: '#64748b' }]}>
          Please log in through the Web Portal. Mobile access is currently not available for Event Organisers.
        </Text>
        <TouchableOpacity 
          style={[styles.actionButtonSmall, { marginTop: 32, backgroundColor: Colors.primary, paddingHorizontal: 30 }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const filteredEvents = isAdmin 
    ? eventsWithAnalytics 
    : eventsWithAnalytics.filter(e => 
        e.organiserId === user?.identifier || 
        e.organiserId === user?.id || 
        (isStaff && e.organiserId === user?.organiserId)
      );

  const filteredBookings = isAdmin
    ? bookings
    : bookings.filter(b => 
        b.organiserId === user?.identifier || 
        b.organiserId === user?.id ||
        (isStaff && b.organiserId === user?.organiserId)
      );

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return (
          <DataTable 
            title="Active Events"
            data={filteredEvents}
            columns={[
              { label: 'Event Details', flex: 1.5 },
              { label: 'Scanned', flex: 0.8, align: 'center' },
              { label: 'Check-in Time', flex: 1.2, align: 'right' },
              { label: 'Status', flex: 1, align: 'right' },
            ]}
            renderItem={(item) => (
              <>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.cell} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.subCell}>{item.venue || item.city || 'TBA'}</Text>
                </View>
                <View style={{ flex: 0.8, alignItems: 'center' }}>
                  <Text style={styles.analyticsText}>{item.scannedCount || 0}</Text>
                  <Text style={styles.subCell}>Tickets</Text>
                </View>
                <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                  <Text style={styles.timeText}>
                    {item.lastScannedAt 
                      ? new Date(item.lastScannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </Text>
                  <Text style={styles.subCell}>
                    {item.lastScannedAt ? new Date(item.lastScannedAt).toLocaleDateString() : 'No Scans'}
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <View style={[styles.statusBadge, { backgroundColor: item.status === 'Live' ? '#dcfce7' : '#fef9c3' }]}>
                  <Text style={[styles.statusText, { color: item.status === 'Live' ? '#166534' : '#854d0e' }]}>
                    {item.status || 'ACTIVE'}
                  </Text>
                </View>
                </View>
              </>
            )}
          />
        );
      case 'bookings':
        return (
          <DataTable 
            title="Recent Bookings"
            data={filteredBookings}
            columns={[
              { label: 'Customer', flex: 2 },
              { label: 'Qty', flex: 0.5 },
              { label: 'Status/Action', flex: 1.5 },
            ]}
            renderItem={(item) => (
              <>
                <View style={{ flex: 2 }}>
                  <Text style={styles.cell} numberOfLines={1}>{item.customerDetails?.name || 'User'}</Text>
                  <Text style={styles.subCell} numberOfLines={1}>{item.customerDetails?.email}</Text>
                  <Text style={styles.eventLabel}>{item.eventName}</Text>
                </View>
                <Text style={[styles.cell, { flex: 0.5, textAlign: 'center' }]}>{item.ticketCount}</Text>
                <View style={{ flex: 1.5, alignItems: 'flex-end', gap: 4 }}>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'Confirmed' ? '#dcfce7' : item.status === 'Cancelled' ? '#fee2e2' : '#fef9c3' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'Confirmed' ? '#166534' : item.status === 'Cancelled' ? '#991b1b' : '#854d0e' }]}>
                       {item.status}
                    </Text>
                  </View>
                  {item.status === 'Pending' && (
                    <TouchableOpacity 
                      style={styles.actionButtonSmall} 
                      onPress={() => handleConfirm(item._id)}
                    >
                      <Text style={styles.actionButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          />
        );
      case 'vendor_bookings':
        return (
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => setActiveTab('hub')} style={styles.backToHub}>
              <Ionicons name="arrow-back" size={16} color={Colors.secondary} />
              <Text style={styles.backToHubText}>Back to Hub</Text>
            </TouchableOpacity>
            <DataTable 
              title="Job Board"
              data={vendorBookings}
              columns={[
                { label: 'Customer', flex: 2 },
                { label: 'Date/Price', flex: 1.5 },
                { label: 'Status', flex: 1 },
              ]}
              renderItem={(item) => (
                <>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.cell}>{item.customerDetails?.name}</Text>
                    <Text style={styles.subCell}>{item.serviceType}</Text>
                    <Text style={styles.subCell}>{item.customerDetails?.phone}</Text>
                  </View>
                  <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                    <Text style={styles.cell}>₹{item.totalAmount}</Text>
                    <Text style={styles.subCell}>{item.bookingDate}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'confirmed' ? '#dcfce7' : item.status === 'pending' ? '#fef9c3' : '#f1f5f9' }]}>
                      <Text style={[styles.statusText, { color: item.status === 'confirmed' ? '#166534' : item.status === 'pending' ? '#854d0e' : '#64748b' }]}>
                         {item.status}
                      </Text>
                    </View>
                    {item.status === 'pending' && (
                      <TouchableOpacity onPress={() => handleUpdateVendorBooking(item._id, 'confirmed')} style={styles.actionButtonSmall}>
                        <Text style={styles.actionButtonText}>Confirm</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            />
          </View>
        );
      case 'services':
        return (
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => setActiveTab('hub')} style={styles.backToHub}>
              <Ionicons name="arrow-back" size={16} color={Colors.secondary} />
              <Text style={styles.backToHubText}>Back to Hub</Text>
            </TouchableOpacity>
            <View style={[styles.tableHeader, { marginTop: 16 }]}>
              <View>
                <Text style={styles.tableTitle}>Manage Pricing</Text>
                <Text style={styles.subCell}>{vendorProfile?.pricing?.length || 0} packages active</Text>
              </View>
              <TouchableOpacity 
                style={styles.addBtnCircle} 
                onPress={() => { setIsAddingPkg(!isAddingPkg); setEditItem(null); }}
              >
                <Ionicons name={isAddingPkg ? "close" : "add"} size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {isAddingPkg && (
               <View style={[styles.inlineEdit, { marginTop: 0, marginBottom: 24 }]}>
                  <Text style={styles.editTitle}>Create New Package</Text>
                  <TextInput 
                    style={[styles.inputField, { marginBottom: 10 }]}
                    value={newPkg.label}
                    onChangeText={(val) => setNewPkg({ ...newPkg, label: val })}
                    placeholder="Package Name (e.g. Basic Bridal)"
                    placeholderTextColor="#94a3b8"
                  />
                  <TextInput 
                    style={[styles.inputField, { marginBottom: 10, height: 60 }]}
                    value={newPkg.description}
                    onChangeText={(val) => setNewPkg({ ...newPkg, description: val })}
                    placeholder="Brief Description"
                    placeholderTextColor="#94a3b8"
                    multiline
                  />
                  <View style={styles.editRow}>
                     <Text style={styles.editPrefix}>₹</Text>
                     <TextInput 
                       style={styles.inputField}
                       keyboardType="numeric"
                       value={newPkg.price}
                       onChangeText={(val) => setNewPkg({ ...newPkg, price: val })}
                       placeholder="Price"
                       placeholderTextColor="#94a3b8"
                     />
                     <TouchableOpacity 
                       style={styles.saveBtn}
                       onPress={createPackage}
                     >
                       <Text style={styles.saveBtnText}>Create</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            )}

            <DataTable 
              title=""
              data={vendorProfile?.pricing || []}
              columns={[
                { label: 'Service / Package', flex: 2 },
                { label: 'Price (₹)', flex: 1 },
              ]}
              renderItem={(item) => (
                <>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.cell}>{item.label || item.name}</Text>
                    <Text style={styles.subCell} numberOfLines={1}>{item.description || 'No description provided'}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end', gap: 4 }}>
                    <Text style={[styles.cell, { color: Colors.secondary, fontSize: 16 }]}>₹{item.price}</Text>
                    <TouchableOpacity onPress={() => { setEditItem(item); setIsAddingPkg(false); }} style={styles.editBtnSmall}>
                      <Text style={styles.editBtnText}>Edit Price</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            />
            {editItem && (
               <View style={styles.inlineEdit}>
                 <Text style={styles.editTitle}>Update Price for {editItem.label || editItem.name}</Text>
                 <View style={styles.editRow}>
                    <Text style={styles.editPrefix}>₹</Text>
                    <TextInput 
                      style={styles.inputField}
                      keyboardType="numeric"
                      value={String(editItem.price ?? "")}
                      onChangeText={(val) => setEditItem({ ...editItem, price: val })}
                      placeholder="Enter price"
                    />
                    <TouchableOpacity 
                      style={styles.saveBtn}
                      onPress={() => updatePrice(editItem.label, editItem.price)}
                    >
                      <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                 </View>
               </View>
            )}
          </View>
        );
      case 'feedbacks':
        return (
          <View style={{ flex: 1, padding: 16 }}>
            <TouchableOpacity onPress={() => setActiveTab('hub')} style={styles.backToHub}>
              <Ionicons name="arrow-back" size={16} color={Colors.secondary} />
              <Text style={styles.backToHubText}>Back to Hub</Text>
            </TouchableOpacity>
            {reviews.map((review) => (
              <View key={review._id} style={styles.mgmtReviewCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '900' }}>{review.customerName}</Text>
                  <Text style={{ color: '#f59e0b', fontWeight: '800' }}>{review.rating} ★</Text>
                </View>
                <View style={styles.mgmtCommentBox}>
                  <Text style={styles.mgmtCommentText}>"{review.comment}"</Text>
                </View>
                {review.response ? (
                  <View style={styles.responseContainer}>
                    <Text style={styles.responseLabelMini}>Your Response</Text>
                    <View style={styles.responseBubble}>
                      <Text style={styles.responseTextSmall}>{review.response}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.replyActionContainer}>
                    {replyingTo === review._id ? (
                      <View style={styles.manualReplyForm}>
                        <TextInput 
                          style={styles.manualReplyInput}
                          placeholder="Write a response..."
                          multiline
                          value={replyText}
                          onChangeText={setReplyText}
                        />
                        <View style={styles.replyActions}>
                          <TouchableOpacity style={styles.cancelReplyBtn} onPress={() => setReplyingTo(null)}>
                            <Text style={styles.cancelReplyText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.submitReplyBtn} onPress={() => handleRespond(review._id)}>
                            <Text style={styles.submitReplyText}>{isSubmittingReply ? 'Sending...' : 'Submit'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.openReplyBtn} onPress={() => setReplyingTo(review._id)}>
                        <Ionicons name="chatbubble-ellipses" size={14} color={Colors.secondary} />
                        <Text style={styles.openReplyText}>Respond</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      case 'portfolio':
        return (
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => setActiveTab('hub')} style={styles.backToHub}>
              <Ionicons name="arrow-back" size={16} color={Colors.secondary} />
              <Text style={styles.backToHubText}>Back to Hub</Text>
            </TouchableOpacity>
            
            <View style={[styles.tableHeader, { marginTop: 16 }]}>
              <View>
                <Text style={styles.tableTitle}>Portfolio Gallery</Text>
                <Text style={styles.subCell}>{vendorProfile?.portfolio?.length || 0} items published</Text>
              </View>
              <TouchableOpacity 
                style={styles.addBtnCircle} 
                onPress={() => setIsAddingPortfolio(!isAddingPortfolio)}
              >
                <Ionicons name={isAddingPortfolio ? "close" : "add"} size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {isAddingPortfolio && (
               <View style={[styles.inlineEdit, { marginTop: 0, marginBottom: 24 }]}>
                  <Text style={styles.editTitle}>Publish New Media</Text>
                  <TextInput 
                    style={[styles.inputField, { marginBottom: 10 }]}
                    value={portfolioMeta.url}
                    onChangeText={(val) => setPortfolioMeta({ ...portfolioMeta, url: val })}
                    placeholder="Media URL (e.g. Unsplash or Storage ID)"
                    placeholderTextColor="#94a3b8"
                  />
                  
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                    {['Bridal', 'Arabic', 'Minimal', 'Trad.'].map(cat => (
                      <TouchableOpacity 
                        key={cat}
                        onPress={() => setPortfolioMeta({ ...portfolioMeta, category: cat })}
                        style={[styles.miniChip, portfolioMeta.category === cat && styles.miniChipActive]}
                      >
                        <Text style={[styles.miniChipText, portfolioMeta.category === cat && styles.miniChipTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <TouchableOpacity 
                      onPress={() => setPortfolioMeta({ ...portfolioMeta, isTopDesign: !portfolioMeta.isTopDesign })}
                      style={[styles.toggleBtn, portfolioMeta.isTopDesign && styles.toggleBtnActive]}
                    >
                      <Ionicons name="star" size={14} color={portfolioMeta.isTopDesign ? "#fff" : "#94a3b8"} />
                      <Text style={[styles.toggleText, portfolioMeta.isTopDesign && styles.toggleTextActive]}>Masterpiece</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setPortfolioMeta({ ...portfolioMeta, beforeAfter: !portfolioMeta.beforeAfter })}
                      style={[styles.toggleBtn, portfolioMeta.beforeAfter && styles.toggleBtnActive]}
                    >
                      <Ionicons name="swap-horizontal" size={14} color={portfolioMeta.beforeAfter ? "#fff" : "#94a3b8"} />
                      <Text style={[styles.toggleText, portfolioMeta.beforeAfter && styles.toggleTextActive]}>B / A Mode</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    style={styles.saveBtn}
                    onPress={addPortfolioItem}
                  >
                    <Text style={styles.saveBtnText}>Publish to Portfolio</Text>
                  </TouchableOpacity>
               </View>
            )}

            <View style={styles.galleryGrid}>
              {(vendorProfile?.portfolio || []).map((item, idx) => (
                <View key={idx} style={styles.galleryTile}>
                  <Image source={{ uri: item.url }} style={styles.galleryImg} />
                  {item.isTopDesign && (
                    <View style={styles.tileBadge}>
                      <Ionicons name="star" size={10} color="#fff" />
                    </View>
                  )}
                  {item.beforeAfter && (
                    <View style={[styles.tileBadge, { left: 6, right: 'auto', backgroundColor: Colors.secondary }]}>
                      <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>B/A</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.deleteTileBtn}
                    onPress={() => {
                      const updated = vendorProfile.portfolio.filter((_, i) => i !== idx);
                      handleUpdateProfile({ portfolio: updated, category: vendorProfile.category });
                    }}
                  >
                    <Ionicons name="trash" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {(!vendorProfile?.portfolio || vendorProfile.portfolio.length === 0) && (
                <View style={styles.emptyGallery}>
                   <Ionicons name="images-outline" size={40} color="#e2e8f0" />
                   <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 10 }}>Gallery is Empty</Text>
                </View>
              )}
            </View>
          </View>
        );
      case 'profile_edit':
        return (
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <TouchableOpacity onPress={() => setActiveTab('hub')} style={[styles.backToHub, { paddingLeft: 0 }]}>
              <Ionicons name="arrow-back" size={20} color={Colors.secondary} />
              <Text style={styles.backToHubText}>Discard Changes</Text>
            </TouchableOpacity>

            <Text style={[styles.tableTitle, { marginBottom: 24 }]}>Edit Professional Profile</Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>First Name</Text>
              <TextInput 
                style={styles.inputField}
                value={profileForm.firstName}
                onChangeText={(val) => setProfileForm({ ...profileForm, firstName: val })}
                placeholder="Enter your first name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Last Name</Text>
              <TextInput 
                style={styles.inputField}
                value={profileForm.lastName}
                onChangeText={(val) => setProfileForm({ ...profileForm, lastName: val })}
                placeholder="Enter your last name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Professional Category</Text>
              <TextInput 
                style={styles.inputField}
                value={profileForm.category}
                onChangeText={(val) => setProfileForm({ ...profileForm, category: val })}
                placeholder="e.g. Mehendi Artist, Photographer"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contact Phone</Text>
              <TextInput 
                style={styles.inputField}
                value={profileForm.phone}
                onChangeText={(val) => setProfileForm({ ...profileForm, phone: val })}
                placeholder="Your business phone"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Professional Bio</Text>
              <TextInput 
                style={[styles.inputField, { height: 120, textAlignVertical: 'top', paddingTop: 12 }]}
                value={profileForm.bio}
                onChangeText={(val) => setProfileForm({ ...profileForm, bio: val })}
                placeholder="Tell your clients about your expertise, experience and style..."
                multiline
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Business Address</Text>
              <TextInput 
                style={styles.inputField}
                value={profileForm.address}
                onChangeText={(val) => setProfileForm({ ...profileForm, address: val })}
                placeholder="e.g. Studio 42, MG Road, Bangalore"
              />
            </View>

            <TouchableOpacity 
              style={styles.saveProfileBtn}
              onPress={() => handleUpdateProfile({
                name: `${profileForm.firstName} ${profileForm.lastName}`.trim(),
                bio: profileForm.bio,
                category: profileForm.category,
                phone: profileForm.phone,
                address: profileForm.address
              })}
            >
              <Text style={styles.saveProfileBtnText}>Save Professional Profile</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        );
      case 'hub':
        return (
          <View style={styles.hubContainer}>
            <View style={styles.statBanner}>
              <View style={styles.statBannerLeft}>
                <Text style={styles.statValueBig}>{totals.rating}</Text>
                <Text style={styles.statLabelSub}>Avg Rating</Text>
              </View>
              <View style={styles.vDivider} />
              <View style={styles.statBannerRight}>
                <Text style={styles.statValueMed}>{reviews.length}</Text>
                <Text style={styles.statLabelSub}>Reflections</Text>
              </View>
            </View>
            <Text style={styles.hubWelcome}>Business Command Center</Text>
            <View style={styles.hubGrid}>
              <TouchableOpacity style={styles.hubCard} onPress={() => setActiveTab('vendor_bookings')}>
                <View style={[styles.hubIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="calendar" size={28} color="#3b82f6" />
                </View>
                <Text style={styles.hubCardTitle}>Bookings</Text>
                <Text style={styles.hubCardSub}>{vendorBookings.length} Active Leads</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubCard} onPress={() => setActiveTab('portfolio')}>
                <View style={[styles.hubIconBox, { backgroundColor: '#fdf2f8' }]}>
                  <Ionicons name="images" size={28} color={Colors.secondary} />
                </View>
                <Text style={styles.hubCardTitle}>Portfolio</Text>
                <Text style={styles.hubCardSub}>{vendorProfile?.portfolio?.length || 0} Showcases</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubCard} onPress={() => setActiveTab('services')}>
                <View style={[styles.hubIconBox, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="pricetags" size={28} color="#22c55e" />
                </View>
                <Text style={styles.hubCardTitle}>Pricing</Text>
                <Text style={styles.hubCardSub}>{vendorProfile?.pricing?.length || 0} Packages</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hubCard} onPress={() => setActiveTab('feedbacks')}>
                <View style={[styles.hubIconBox, { backgroundColor: '#fff7ed' }]}>
                  <Ionicons name="star" size={28} color="#f59e0b" />
                </View>
                <Text style={styles.hubCardTitle}>Feedbacks</Text>
                <Text style={styles.hubCardSub}>{reviews.length} Reflections</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.wideActionCard}>
              <View style={styles.hubInfo}>
                <Text style={styles.wideTitle}>Professional Profile</Text>
                <Text style={styles.wideSub}>Update your artist bio, category, and verified contact details to attract more clients.</Text>
              </View>
              <TouchableOpacity style={styles.wideActionBtn} onPress={() => setActiveTab('profile_edit')}>
                 <Text style={styles.wideActionBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'scans':
        return (
          <DataTable 
            title="Live Scan History"
            data={scans}
            columns={[
              { label: 'Attendee', flex: 2 },
              { label: 'Scan Time', flex: 1.5 },
            ]}
            renderItem={(item) => (
              <>
                <View style={{ flex: 2 }}>
                  <Text style={styles.cell} numberOfLines={1}>{item.userName || item.customerEmail || 'Guest'}</Text>
                  <Text style={styles.subCell} numberOfLines={1}>{item.eventName}</Text>
                  <View style={[styles.statusBadge, { alignSelf: 'flex-start', marginTop: 4, backgroundColor: item.status === 'valid' ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'valid' ? '#166534' : '#991b1b' }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                  <Text style={styles.timeText}>
                    {item.scannedAt 
                      ? new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </Text>
                  <Text style={styles.subCell}>
                    {item.scannedAt ? new Date(item.scannedAt).toLocaleDateString() : 'N/A'}
                  </Text>
                </View>
              </>
            )}
          />
        );
      case 'admin':
        return (
          <ScrollView>
            <View style={styles.adminCard}>
              <View style={styles.adminCardHeader}>
                <Ionicons name="settings" size={24} color={Colors.secondary} />
                <Text style={styles.adminCardTitle}>System Configuration</Text>
              </View>
              <View style={styles.configRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.configLabel}>Internal Meeting Portal</Text>
                  <Text style={styles.configSub}>Allow users to join internal WebRTC meetings</Text>
                </View>
                <TouchableOpacity 
                   style={[styles.toggleBtn, internalMeetingPortalEnabled ? styles.toggleOn : styles.toggleOff]}
                   onPress={() => toggleInternalPortalMutation()}
                >
                  <Text style={styles.toggleText}>{internalMeetingPortalEnabled ? 'ENABLED' : 'DISABLED'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <DataTable 
              title="Failed Logins (24h)"
              data={failedLogins}
              columns={[
                { label: 'Identifier', flex: 1.5 },
                { label: 'Device / IP', flex: 2 },
                { label: 'Time', flex: 1, align: 'right' },
              ]}
              renderItem={(item) => (
                <>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.cell} numberOfLines={1}>{item.identifier}</Text>
                    <Text style={styles.subCell}>{item.ip}</Text>
                  </View>
                  <Text style={[styles.subCell, { flex: 2 }]} numberOfLines={2}>{item.userAgent}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </>
              )}
            />
          </ScrollView>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Management</Text>
        <Text style={styles.sub}>{isVendor ? 'VENDOR' : user?.role?.toUpperCase()} Portal • Real-time Monitoring</Text>
        
        {isVendor && vendorStats && (
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{vendorStats.totalBookings}</Text>
              <Text style={styles.statLab}>Bookings</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>₹{vendorStats.totalEarnings}</Text>
              <Text style={styles.statLab}>Earnings</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{vendorStats.avgRating.toFixed(1)} ★</Text>
              <Text style={styles.statLab}>Rating</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        {!isStaff && !isVendor && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => setActiveTab('events')}
          >
            <Ionicons name="apps" size={20} color={activeTab === 'events' ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>Events</Text>
          </TouchableOpacity>
        )}
        {isVendor && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'hub' && styles.activeTab]}
            onPress={() => setActiveTab('hub')}
          >
            <Ionicons name="grid" size={20} color={activeTab === 'hub' ? '#fff' : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'hub' && styles.activeTabText]}>Tools</Text>
          </TouchableOpacity>
        )}
        {!isStaff && !isVendor && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bookings' && styles.activeTab]}
            onPress={() => setActiveTab('bookings')}
          >
            <Ionicons name="ticket" size={20} color={activeTab === 'bookings' ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'bookings' && styles.activeTabText]}>Bookings</Text>
          </TouchableOpacity>
        )}
        {!isVendor && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'scans' && styles.activeTab]}
            onPress={() => setActiveTab('scans')}
          >
            <Ionicons name="scan-circle" size={20} color={activeTab === 'scans' ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'scans' && styles.activeTabText]}>Live Scans</Text>
          </TouchableOpacity>
        )}
        {isAdmin && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'admin' && styles.activeTab]}
            onPress={() => setActiveTab('admin')}
          >
            <Ionicons name="shield-half" size={20} color={activeTab === 'admin' ? Colors.secondary : Colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'admin' && styles.activeTabText]}>Admin</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 24, backgroundColor: Colors.text, paddingBottom: 60, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  title: { fontSize: 32, fontWeight: '900', color: '#fff' },
  sub: { fontSize: 13, color: '#94a3b8', fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', gap: 12, marginTop: 24 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statVal: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  statLab: { fontSize: 10, fontWeight: '700', color: '#94a3b8', marginTop: 4, textTransform: 'uppercase' },
  tabs: { 
    flexDirection: 'row', 
    padding: 16, 
    gap: 8, 
    marginTop: -40,
    backgroundColor: 'transparent',
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeTab: {
    backgroundColor: Colors.secondary,
  },
  tabText: { fontSize: 11, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase' },
  activeTabText: { color: '#fff' },
  tableContainer: { padding: 16, marginTop: 8 },
  tableHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  tableTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  tableCount: { fontSize: 14, fontWeight: '700', color: Colors.secondary, backgroundColor: '#fff5f7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  columnHeaders: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginBottom: 10 
  },
  columnHeader: { fontSize: 10, fontWeight: '800', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 18, 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cell: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  analyticsText: { fontSize: 16, fontWeight: '900', color: Colors.secondary },
  subCell: { fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: '600' },
  eventLabel: { fontSize: 10, color: Colors.secondary, fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },
  timeText: { fontSize: 14, fontWeight: '800', color: Colors.text },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  actionButtonSmall: {
    backgroundColor: Colors.secondary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionButtonText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 60, fontSize: 15, fontWeight: '600' },
  adminCard: { backgroundColor: '#fff', margin: 16, borderRadius: 24, padding: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  adminCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
  adminCardTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  configRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  configLabel: { fontSize: 15, fontWeight: '800', color: Colors.text },
  configSub: { fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: '600' },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  toggleOn: { backgroundColor: '#dcfce7' },
  toggleOff: { backgroundColor: '#fee2e2' },
  toggleText: { fontSize: 10, fontWeight: '900', color: Colors.text },
  hubContainer: { padding: 16, marginTop: 8 },
  hubWelcome: { fontSize: 13, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, paddingHorizontal: 8 },
  hubGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12,
  },
  hubCard: { 
    width: '48%', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 24, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  hubIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  hubCardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  hubCardSub: { fontSize: 10, fontWeight: '600', color: '#94a3b8', marginTop: 2 },
  wideActionCard: { 
    width: '100%', 
    backgroundColor: '#0f172a', 
    borderRadius: 24, 
    padding: 20, 
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hubInfo: { flex: 1, marginRight: 16 },
  wideTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  wideSub: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 4 },
  wideActionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  wideActionBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  backToHub: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 6 },
  backToHubText: { fontSize: 13, fontWeight: '800', color: Colors.secondary },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  galleryTile: { width: '31%', aspectRatio: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#e2e8f0' },
  galleryImg: { width: '100%', height: '100%' },
  tileBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#f59e0b', padding: 4, borderRadius: 6 },
  deleteTileBtn: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(239, 68, 68, 0.8)', padding: 6, borderRadius: 8 },
  addBtnCircle: { backgroundColor: Colors.secondary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  inlineEdit: { backgroundColor: '#fff', margin: 16, borderRadius: 24, padding: 20, borderTopWidth: 4, borderTopColor: Colors.primary },
  editTitle: { fontSize: 16, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  editPrefix: { fontSize: 18, fontWeight: '800', color: Colors.text },
  saveBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 16, height: 40, borderRadius: 10, justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  editBtnSmall: { marginTop: 4, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#f1f5f9', borderRadius: 6 },
  editBtnText: { fontSize: 10, fontWeight: '800', color: Colors.secondary },
  inputField: { flex: 1, height: 45, backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: Colors.text, borderWidth: 1, borderColor: '#e2e8f0' },
  statBanner: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, alignItems: 'center' },
  statBannerLeft: { flex: 1, alignItems: 'center' },
  statBannerRight: { flex: 1, alignItems: 'center' },
  vDivider: { width: 1, height: 40, backgroundColor: '#f1f5f9' },
  statValueBig: { fontSize: 32, fontWeight: '900', color: Colors.secondary },
  statValueMed: { fontSize: 24, fontWeight: '900', color: Colors.text },
  statLabelSub: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginTop: 4 },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 11, fontWeight: '900', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  saveProfileBtn: { backgroundColor: Colors.secondary, padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 12, elevation: 4, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  saveProfileBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});

