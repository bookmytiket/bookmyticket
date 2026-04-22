import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Image, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSupabaseQuery, useSupabaseMutation } from '../hooks/useSupabase';
import { supabase } from '../lib/supabase';
import { Colors } from '../theme/Theme';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
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
        keyExtractor={(item, index) => item.id || `row-${index}`}
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

  const isStaff = user?.role === 'staff';
  const isAdmin = user?.role === 'admin';
  const isOrganiser = user?.role === 'organiser';
  const isVendor = user?.role === 'vendor' || isServiceProvider(user?.category);



  const [activeTab, setActiveTab] = useState(isStaff ? 'scans' : isVendor ? 'hub' : 'events');
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
  const [isAddingPkg, setIsAddingPkg] = useState(false);
  const [newPkg, setNewPkg] = useState({ label: '', description: '', price: '' });

  const vendorId = user?.id || "";

  // Migrated Queries
  const { data: events = [], loading: loadingEvents } = useSupabaseQuery('events', (q) => {
    let query = q.select('*, organiser:organiser_id(*)');
    if (!isAdmin) {
      query = query.eq('organiser_id', user?.id);
    }
    return query;
  }, [user?.id, isAdmin]);

  const { data: bookings = [], loading: loadingBookings } = useSupabaseQuery('bookings', (q) => {
    let query = q.select('*, event:event_id!inner(*)');
    if (!isAdmin) {
      query = query.eq('event.organiser_id', user?.id);
    }
    return query;
  }, [user?.id, isAdmin]);

  const { data: vendorBookings = [] } = useSupabaseQuery('vendor_bookings', (q) => 
    vendorId ? q.select('*').eq('vendor_id', vendorId) : q.select('*').limit(0), 
    [vendorId]
  );

  const { data: reviews = [] } = useSupabaseQuery('vendor_reviews', (q) => 
    vendorId ? q.select('*').eq('vendor_id', vendorId) : q.select('*').limit(0), 
    [vendorId]
  );

  const { data: vendorProfile, loading: loadingProfile } = useSupabaseQuery('service_providers', (q) => 
    q.select('*, profiles:organiser_id(*)').eq('id', user?.id).single(),
    [user?.id]
  );

  const { data: scans = [] } = useSupabaseQuery('pwa_scans', (q) => 
    q.select('*, event:event_id(*)').eq('organiser_id', user?.id),
    [user?.id]
  );

  const { data: packages = [] } = useSupabaseQuery('artistPackages', (q) => 
    user?.id ? q.select('*').eq('vendor_id', user?.id) : q.select('*').limit(0), 
    [user?.id]
  );

  // Migrations
  const { mutate: updateVendorProfile } = useSupabaseMutation((s, updates) => s.from('service_providers').update(updates).eq('id', updates.id));
  const { mutate: confirmBooking } = useSupabaseMutation((s, payload) => s.from('bookings').update({ status: payload.status }).eq('id', payload.id));
  const { mutate: updateVendorBookingStatus } = useSupabaseMutation((s, payload) => s.from('vendor_bookings').update({ status: payload.status }).eq('id', payload.id));
  const { mutate: respondToReview } = useSupabaseMutation((s, payload) => s.from('vendor_reviews').update({ response: payload.response }).eq('id', payload.id));
  const { mutate: createArtistPackage } = useSupabaseMutation((s, data) => s.from('artistPackages').insert(data));
  const { mutate: updateArtistPackage } = useSupabaseMutation((s, p) => s.from('artistPackages').update({ price: p.price }).eq('id', p.id));
  const { mutate: deleteArtistPackage } = useSupabaseMutation((s, p) => s.from('artistPackages').delete().eq('id', p.id));

  const totals = useMemo(() => ({
    bookings: (events || []).reduce((acc, e) => acc + (e.bookings_count || 0), 0) || 0,
    revenue: (events || []).reduce((acc, e) => acc + (e.revenue || 0), 0) || 0,
    rating: (reviews || []).length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0"
  }), [events, reviews]);

  const handleConfirm = async (id) => {
    try {
      await confirmBooking({ id, status: 'Confirmed' });
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

  const handleUpdateProfile = async (updates) => {
    try {
      await updateVendorProfile({ id: vendorProfile.id, ...updates });
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
      portfolio: [...currentPortfolio, newItem]
    });
    setIsAddingPortfolio(false);
    setPortfolioMeta({ url: '', category: 'Bridal', isTopDesign: false, beforeAfter: false });
  };

  const updatePrice = async (pkgId, newPrice) => {
    try {
      await updateArtistPackage({ id: pkgId, price: parseFloat(newPrice) });
      Alert.alert('Success', 'Price updated');
    } catch (err) {
      Alert.alert('Error', 'Failed to update price');
    }
    setEditItem(null);
  };

  const createPackage = async () => {
    if (!newPkg.label || !newPkg.price) {
      Alert.alert('Required', 'Please provide at least a name and price.');
      return;
    }
    try {
      await createArtistPackage({ 
        vendor_id: user.id,
        title: newPkg.label, 
        description: newPkg.description, 
        price: parseFloat(newPkg.price),
        status: 'Active'
      });
      setIsAddingPkg(false);
      setNewPkg({ label: '', description: '', price: '' });
      Alert.alert('Success', 'Package created!');
    } catch (err) {
      Alert.alert('Error', 'Failed to create package');
    }
  };

  const removePackage = async (pkgId) => {
    Alert.alert(
      "Confirm Removal",
      "Are you sure you want to delete this service tier?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteArtistPackage({ id: pkgId });
            } catch (err) {
              Alert.alert('Error', 'Failed to delete package');
            }
          }
        }
      ]
    );
  };

  if (authLoading || !user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.secondary} />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading dashboard...</Text>
      </View>
    );
  }



  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return (
          <DataTable 
            title="Active Events"
            data={events}
            columns={[
              { label: 'Event Details', flex: 1.5 },
              { label: 'Scanned', flex: 0.8, align: 'center' },
              { label: 'Last Scan', flex: 1.2, align: 'right' },
            ]}
            renderItem={(item) => (
              <>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.cell} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.subCell}>{item.location || 'TBA'}</Text>
                </View>
                <View style={{ flex: 0.8, alignItems: 'center' }}>
                  <Text style={styles.analyticsText}>{item.scanned_count || 0}</Text>
                  <Text style={styles.subCell}>Tickets</Text>
                </View>
                <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                  <Text style={styles.timeText}>
                    {item.last_scanned_at 
                      ? new Date(item.last_scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </Text>
                  <Text style={styles.subCell}>
                    {item.last_scanned_at ? new Date(item.last_scanned_at).toLocaleDateString() : 'No Scans'}
                  </Text>
                </View>
              </>
            )}
          />
        );
      case 'bookings':
        return (
          <DataTable 
            title="Recent Bookings"
            data={bookings}
            columns={[
              { label: 'Customer', flex: 2 },
              { label: 'Qty', flex: 0.5 },
              { label: 'Status', flex: 1.5 },
            ]}
            renderItem={(item) => (
              <>
                <View style={{ flex: 2 }}>
                  <Text style={styles.cell} numberOfLines={1}>{item.customer_details?.name || 'User'}</Text>
                  <Text style={styles.subCell} numberOfLines={1}>{item.customer_details?.email}</Text>
                  <Text style={styles.eventLabel}>{item.event?.title}</Text>
                </View>
                <Text style={[styles.cell, { flex: 0.5, textAlign: 'center' }]}>{item.ticket_count}</Text>
                <View style={{ flex: 1.5, alignItems: 'flex-end', gap: 4 }}>
                  <View style={[styles.statusBadge, { backgroundColor: item.status === 'Confirmed' ? '#dcfce7' : item.status === 'Cancelled' ? '#fee2e2' : '#fef9c3' }]}>
                    <Text style={[styles.statusText, { color: item.status === 'Confirmed' ? '#166534' : item.status === 'Cancelled' ? '#991b1b' : '#854d0e' }]}>
                       {item.status}
                    </Text>
                  </View>
                  {item.status === 'Pending' && (
                    <TouchableOpacity 
                      style={styles.actionButtonSmall} 
                      onPress={() => handleConfirm(item.id)}
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
                    <Text style={styles.cell}>{item.customer_details?.name}</Text>
                    <Text style={styles.subCell}>{item.service_type}</Text>
                    <Text style={styles.subCell}>{item.customer_details?.phone}</Text>
                  </View>
                  <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                    <Text style={styles.cell}>₹{item.total_amount}</Text>
                    <Text style={styles.subCell}>{item.booking_date}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end', gap: 6 }}>
                    <View style={[styles.statusBadge, { backgroundColor: item.status === 'Confirmed' ? '#dcfce7' : item.status === 'Pending' ? '#fef9c3' : '#f1f5f9' }]}>
                      <Text style={[styles.statusText, { color: item.status === 'Confirmed' ? '#166534' : item.status === 'Pending' ? '#854d0e' : '#64748b' }]}>
                         {item.status}
                      </Text>
                    </View>
                    {item.status === 'Pending' && (
                      <TouchableOpacity onPress={() => handleUpdateVendorBooking(item.id, 'Confirmed')} style={styles.actionButtonSmall}>
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
                <Text style={styles.subCell}>{packages?.length || 0} packages active</Text>
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
                       style={[styles.inputField, { flex: 1, marginRight: 10 }]}
                       keyboardType="numeric"
                       value={newPkg.price}
                       onChangeText={(val) => setNewPkg({ ...newPkg, price: val })}
                       placeholder="Price"
                       placeholderTextColor="#94a3b8"
                     />
                     <TouchableOpacity 
                       style={[styles.saveBtn, { flex: 0.8 }]}
                       onPress={createPackage}
                     >
                       <Text style={styles.saveBtnText}>Create</Text>
                     </TouchableOpacity>
                  </View>
               </View>
            )}

            <DataTable 
              title=""
              data={packages}
              columns={[
                { label: 'Service / Package', flex: 2 },
                { label: 'Price (₹)', flex: 1.5 },
              ]}
              renderItem={(item) => (
                <>
                  <View style={{ flex: 2 }}>
                    <Text style={styles.cell}>{item.title || item.name}</Text>
                    <Text style={styles.subCell} numberOfLines={1}>{item.description || 'No description provided'}</Text>
                  </View>
                  <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.cell, { color: Colors.secondary, fontSize: 16 }]}>₹{item.price}</Text>
                        <TouchableOpacity onPress={() => { setEditItem(item); setIsAddingPkg(false); }} style={styles.editBtnSmall}>
                          <Text style={styles.editBtnText}>Edit Price</Text>
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity onPress={() => removePackage(item.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            />
            {editItem && (
               <View style={styles.inlineEdit}>
                 <Text style={styles.editTitle}>Update Price for {editItem.title || editItem.name}</Text>
                 <View style={styles.editRow}>
                    <Text style={styles.editPrefix}>₹</Text>
                    <TextInput 
                      style={[styles.inputField, { flex: 1, marginRight: 10 }]}
                      keyboardType="numeric"
                      value={String(editItem.price ?? "")}
                      onChangeText={(val) => setEditItem({ ...editItem, price: val })}
                      placeholder="Enter price"
                    />
                    <TouchableOpacity 
                      style={[styles.saveBtn, { flex: 0.8 }]}
                      onPress={() => updatePrice(editItem.id, editItem.price)}
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
              <View key={review.id} style={styles.mgmtReviewCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '900' }}>{review.user_id}</Text>
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
                    {replyingTo === review.id ? (
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
                          <TouchableOpacity style={styles.submitReplyBtn} onPress={() => handleRespond(review.id)}>
                            <Text style={styles.submitReplyText}>{isSubmittingReply ? 'Sending...' : 'Submit'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.openReplyBtn} onPress={() => setReplyingTo(review.id)}>
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
                    placeholder="Media URL"
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
                  <TouchableOpacity 
                    style={styles.deleteTileBtn}
                    onPress={() => {
                      const updated = vendorProfile.portfolio.filter((_, i) => i !== idx);
                      handleUpdateProfile({ portfolio: updated });
                    }}
                  >
                    <Ionicons name="trash" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
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
                <Text style={styles.statValueMed}>{reviews?.length || 0}</Text>
                <Text style={styles.statLabelSub}>Reflections</Text>
              </View>
            </View>

            {/* Analytics Chart */}
            <View style={styles.chartSection}>
              <Text style={styles.chartTitle}>Revenue Trend (7 Days)</Text>
              <LineChart
                data={{
                  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                  datasets: [{
                    data: [
                      Math.random() * 5000,
                      Math.random() * 5000,
                      Math.random() * 5000,
                      Math.random() * 5000,
                      Math.random() * 10000,
                      Math.random() * 15000,
                      Math.random() * 20000,
                    ]
                  }]
                }}
                width={Dimensions.get("window").width - 32}
                height={180}
                yAxisLabel="₹"
                chartConfig={{
                  backgroundColor: "#fff",
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(244, 63, 94, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: "#f43f5e" }
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16 }}
              />
            </View>

            <Text style={styles.hubWelcome}>Business Command Center</Text>
            <View style={styles.hubGrid}>
              <TouchableOpacity style={styles.hubCard} onPress={() => setActiveTab('vendor_bookings')}>
                <View style={[styles.hubIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="calendar" size={28} color="#3b82f6" />
                </View>
                <Text style={styles.hubCardTitle}>Bookings</Text>
                <Text style={styles.hubCardSub}>{vendorBookings?.length || 0} Active Leads</Text>
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
                <Text style={styles.hubCardSub}>{packages?.length || 0} Packages</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hubCard} onPress={() => setActiveTab('feedbacks')}>
                <View style={[styles.hubIconBox, { backgroundColor: '#fff7ed' }]}>
                  <Ionicons name="star" size={28} color="#f59e0b" />
                </View>
                <Text style={styles.hubCardTitle}>Feedbacks</Text>
                <Text style={styles.hubCardSub}>{reviews?.length || 0} Reflections</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Management</Text>
          {isOrganiser && <Text style={styles.subCell}>Organiser Console</Text>}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle" size={32} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      {isOrganiser && !isVendor && (
        <TouchableOpacity 
          style={styles.webPortalBanner} 
          onPress={() => Linking.openURL('https://bookmyticket.net/organiser')}
        >
          <View style={styles.webPortalIcon}>
            <Ionicons name="globe-outline" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.webPortalTitle}>Advanced Tools on Web</Text>
            <Text style={styles.webPortalSub}>Open bookmyticket.net for full panel access</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}
      <View style={styles.tabs}>
        {!isVendor && (
          <>
            <TouchableOpacity onPress={() => setActiveTab('events')} style={[styles.tab, activeTab === 'events' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>Events</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('bookings')} style={[styles.tab, activeTab === 'bookings' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'bookings' && styles.activeTabText]}>Bookings</Text>
            </TouchableOpacity>
          </>
        )}
        {isVendor && activeTab !== 'vendor_bookings' && activeTab !== 'services' && activeTab !== 'feedbacks' && activeTab !== 'portfolio' && (
          <TouchableOpacity onPress={() => setActiveTab('hub')} style={[styles.tab, activeTab === 'hub' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === 'hub' && styles.activeTabText]}>Vendor Hub</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.black },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: Colors.secondary },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  activeTabText: { color: Colors.secondary },
  tableContainer: { padding: 16 },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  tableTitle: { fontSize: 18, fontWeight: '900', color: Colors.black },
  tableCount: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  columnHeaders: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  columnHeader: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center' },
  cell: { fontSize: 14, fontWeight: '700', color: Colors.black },
  subCell: { fontSize: 11, color: '#64748b', marginTop: 2 },
  analyticsText: { fontSize: 16, fontWeight: '900', color: Colors.secondary },
  timeText: { fontSize: 13, fontWeight: '800', color: Colors.black },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  eventLabel: { fontSize: 10, color: Colors.secondary, fontWeight: '900', textTransform: 'uppercase', marginTop: 4 },
  actionButtonSmall: { backgroundColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  empty: { textAlign: 'center', padding: 20, color: Colors.textLight, fontStyle: 'italic' },
  blockContainer: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 40 },
  blockHeader: { alignItems: 'center', marginBottom: 40 },
  blockTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginTop: 24, marginBottom: 12 },
  blockText: { fontSize: 15, color: Colors.textLight, textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  blockDomain: { fontSize: 18, color: Colors.secondary, fontWeight: '800' },
  blockBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 32, paddingVertical: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  blockBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  backToHub: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  backToHubText: { fontSize: 14, fontWeight: '800', color: Colors.secondary },
  hubContainer: { padding: 16 },
  statBanner: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, borderRadius: 24, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2 },
  statBannerLeft: { flex: 1, alignItems: 'center' },
  statBannerRight: { flex: 1, alignItems: 'center' },
  vDivider: { width: 1, backgroundColor: '#f1f5f9' },
  statValueBig: { fontSize: 32, fontWeight: '900', color: '#f59e0b' },
  statValueMed: { fontSize: 28, fontWeight: '900', color: Colors.secondary },
  statLabelSub: { fontSize: 11, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginTop: 4 },
  hubWelcome: { fontSize: 20, fontWeight: '900', color: Colors.black, marginBottom: 20 },
  hubGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  hubCard: { width: (Dimensions.get('window').width - 48) / 2, backgroundColor: '#fff', padding: 16, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2 },
  hubIconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  hubCardTitle: { fontSize: 16, fontWeight: '900', color: Colors.black },
  hubCardSub: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 4 },
  addBtnCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
  inlineEdit: { backgroundColor: '#fff', padding: 20, borderRadius: 24, borderSize: 1, borderColor: '#f1f5f9', marginBottom: 20 },
  editTitle: { fontSize: 14, fontWeight: '900', color: Colors.black, marginBottom: 15, textTransform: 'uppercase' },
  inputField: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#f1f5f9', fontSize: 14, fontWeight: '700', color: Colors.black },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  editPrefix: { fontSize: 18, fontWeight: '900', color: Colors.secondary },
  saveBtn: { backgroundColor: Colors.black, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, flex: 1 },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  editBtnSmall: { padding: 4 },
  editBtnText: { fontSize: 11, fontWeight: '800', color: Colors.secondary },
  mgmtReviewCard: { backgroundColor: '#fff', padding: 16, borderRadius: 20, marginBottom: 12, borderSize: 1, borderColor: '#f1f5f9' },
  mgmtCommentBox: { marginTop: 10, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12 },
  mgmtCommentText: { fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 20 },
  responseContainer: { marginTop: 12 },
  responseLabelMini: { fontSize: 9, fontWeight: '900', color: Colors.secondary, textTransform: 'uppercase', marginBottom: 4 },
  responseBubble: { padding: 10, backgroundColor: '#eff6ff', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: Colors.secondary },
  responseTextSmall: { fontSize: 12, color: Colors.black, fontWeight: '600' },
  manualReplyForm: { marginTop: 12 },
  manualReplyInput: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, height: 80, textAlignVertical: 'top', fontSize: 13, fontWeight: '600', color: Colors.black },
  replyActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelReplyBtn: { padding: 8 },
  cancelReplyText: { fontSize: 12, fontWeight: '800', color: '#94a3b8' },
  submitReplyBtn: { backgroundColor: Colors.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  submitReplyText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  openReplyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  openReplyText: { fontSize: 12, fontWeight: '800', color: Colors.secondary },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  galleryTile: { width: (Dimensions.get('window').width - 52) / 3, height: 120, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  galleryImg: { width: '100%', height: '100%' },
  tileBadge: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#f59e0b', alignItems: 'center', justifyContent: 'center' },
  deleteTileBtn: { position: 'absolute', bottom: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.8)', alignItems: 'center', justifyContent: 'center' },
  miniChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f1f5f9' },
  miniChipActive: { backgroundColor: Colors.black },
  miniChipText: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  miniChipTextActive: { color: '#fff' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9' },
  toggleBtnActive: { backgroundColor: Colors.secondary },
  toggleText: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  toggleTextActive: { color: '#fff' },
  chartSection: { backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2 },
  chartTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  webPortalBanner: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  webPortalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webPortalTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  webPortalSub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
});
